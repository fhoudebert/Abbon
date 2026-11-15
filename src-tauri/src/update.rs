//! Mises à jour.
//!
//! - Ordinateur (Linux, Windows) : plugin updater de Tauri. Le serveur publie
//!   `releases/latest.json` ; chaque fichier est signé, et la signature est vérifiée avec la
//!   clé publique intégrée à la compilation (`ABBON_UPDATER_PUBKEY`). Sans clé, la mise à
//!   jour automatique est désactivée.
//! - Android (APK hors Play Store) : l'application lit `releases/version.json` et propose
//!   de télécharger le nouvel APK dans le navigateur.
//!
//! L'adresse du serveur par défaut est fixée à la compilation (`ABBON_UPDATE_URL`) et peut
//! être changée dans les Paramètres. Les requêtes partent du code Rust : l'interface web
//! n'a besoin d'aucune connexion sortante (CSP inchangée).

use serde::Serialize;
use tauri::Url;

/// Adresse du serveur fixée à la compilation (variable de dépôt `ABBON_SITE_URL` en CI).
pub fn default_server() -> Option<&'static str> {
    option_env!("ABBON_UPDATE_URL").filter(|s| !s.trim().is_empty())
}

/// Clé publique de signature des mises à jour (contenu du fichier `.pub` de `tauri signer`).
pub fn pubkey() -> Option<&'static str> {
    option_env!("ABBON_UPDATER_PUBKEY").filter(|s| !s.trim().is_empty())
}

/// Valide l'adresse du serveur : HTTPS obligatoire (HTTP toléré pour localhost, pour les tests).
pub fn server_base(input: &str) -> Result<Url, String> {
    let trimmed = input.trim().trim_end_matches('/');
    let url = Url::parse(trimmed).map_err(|_| format!("adresse invalide : {trimmed}"))?;
    let local = matches!(url.host_str(), Some("localhost" | "127.0.0.1" | "[::1]"));
    match url.scheme() {
        "https" => {}
        "http" if local => {}
        _ => return Err("l'adresse du serveur doit commencer par https://".into()),
    }
    if url.query().is_some() || url.fragment().is_some() || !url.username().is_empty() {
        return Err("adresse invalide : ni paramètres, ni identifiants".into());
    }
    Ok(url)
}

/// Adresse d'un fichier du dossier `releases/` du serveur.
pub fn release_file(base: &Url, name: &str) -> Result<Url, String> {
    let mut url = base.clone();
    url.set_path(&format!(
        "{}/releases/{name}",
        base.path().trim_end_matches('/')
    ));
    Ok(url)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSupport {
    /// linux, windows, macos, android, ios
    platform: &'static str,
    /// Mise à jour automatique possible (ordinateur avec clé de signature).
    self_update: bool,
    default_server: Option<&'static str>,
}

#[tauri::command]
pub fn update_support() -> UpdateSupport {
    UpdateSupport {
        platform: std::env::consts::OS,
        self_update: cfg!(desktop) && pubkey().is_some(),
        default_server: default_server(),
    }
}

const MAX_MANIFEST: u64 = 256 * 1024;

/// Lit `releases/version.json` (description de la dernière version, toutes plateformes).
#[tauri::command]
pub async fn fetch_release(server: String) -> Result<serde_json::Value, String> {
    let url = release_file(&server_base(&server)?, "version.json")?;
    tauri::async_runtime::spawn_blocking(move || {
        let agent = ureq::AgentBuilder::new()
            .timeout(std::time::Duration::from_secs(15))
            .user_agent(concat!("Abbon/", env!("CARGO_PKG_VERSION")))
            .build();
        let resp = agent.get(url.as_str()).call().map_err(|e| e.to_string())?;
        let mut body = String::new();
        use std::io::Read;
        resp.into_reader()
            .take(MAX_MANIFEST + 1)
            .read_to_string(&mut body)
            .map_err(|e| e.to_string())?;
        if body.len() as u64 > MAX_MANIFEST {
            return Err("version.json trop volumineux".into());
        }
        serde_json::from_str(&body).map_err(|e| format!("version.json illisible : {e}"))
    })
    .await
    .map_err(|e| e.to_string())?
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AvailableUpdate {
    version: String,
    notes: Option<String>,
    date: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(tag = "event", content = "data", rename_all = "camelCase")]
pub enum DownloadEvent {
    Started { total: Option<u64> },
    Progress { chunk: usize },
    Finished,
}

#[cfg(desktop)]
pub mod platform {
    use super::*;
    use tauri::{AppHandle, Runtime, ipc::Channel};
    use tauri_plugin_updater::UpdaterExt;

    async fn find<R: Runtime>(
        app: &AppHandle<R>,
        server: &str,
    ) -> Result<Option<tauri_plugin_updater::Update>, String> {
        if pubkey().is_none() {
            return Err("mises à jour non configurées (pas de clé de signature)".into());
        }
        let endpoint = release_file(&server_base(server)?, "latest.json")?;
        app.updater_builder()
            .endpoints(vec![endpoint])
            .map_err(|e| e.to_string())?
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .map_err(|e| e.to_string())?
            .check()
            .await
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn check_update<R: Runtime>(
        app: AppHandle<R>,
        server: String,
    ) -> Result<Option<AvailableUpdate>, String> {
        Ok(find(&app, &server).await?.map(|u| AvailableUpdate {
            version: u.version.clone(),
            notes: u.body.clone(),
            date: u.date.map(|d| d.to_string()),
        }))
    }

    /// Télécharge, vérifie la signature, installe puis relance l'application.
    #[tauri::command]
    pub async fn install_update<R: Runtime>(
        app: AppHandle<R>,
        server: String,
        on_event: Channel<DownloadEvent>,
    ) -> Result<(), String> {
        let update = find(&app, &server)
            .await?
            .ok_or("aucune mise à jour disponible")?;
        let mut started = false;
        update
            .download_and_install(
                |chunk, total| {
                    if !started {
                        started = true;
                        let _ = on_event.send(DownloadEvent::Started { total });
                    }
                    let _ = on_event.send(DownloadEvent::Progress { chunk });
                },
                || {
                    let _ = on_event.send(DownloadEvent::Finished);
                },
            )
            .await
            .map_err(|e| e.to_string())?;
        app.restart()
    }
}

#[cfg(mobile)]
pub mod platform {
    use super::*;
    use tauri::{AppHandle, Runtime, ipc::Channel};

    #[tauri::command]
    pub async fn check_update<R: Runtime>(
        _app: AppHandle<R>,
        _server: String,
    ) -> Result<Option<AvailableUpdate>, String> {
        Err("mise à jour automatique indisponible sur mobile".into())
    }

    #[tauri::command]
    pub async fn install_update<R: Runtime>(
        _app: AppHandle<R>,
        _server: String,
        _on_event: Channel<DownloadEvent>,
    ) -> Result<(), String> {
        Err("mise à jour automatique indisponible sur mobile".into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_https_and_local_http() {
        assert_eq!(
            server_base("https://qcm.example.org/").unwrap().as_str(),
            "https://qcm.example.org/"
        );
        assert!(server_base("http://127.0.0.1:8080").is_ok());
        assert!(server_base("http://localhost/abbon").is_ok());
    }

    #[test]
    fn rejects_insecure_or_odd_addresses() {
        assert!(server_base("http://qcm.example.org").is_err());
        assert!(server_base("ftp://qcm.example.org").is_err());
        assert!(server_base("https://user:pw@qcm.example.org").is_err());
        assert!(server_base("https://qcm.example.org/?x=1").is_err());
        assert!(server_base("pas une adresse").is_err());
    }

    #[test]
    fn builds_release_file_urls_under_subfolders() {
        let base = server_base("https://exemple.fr/abbon/").unwrap();
        assert_eq!(
            release_file(&base, "latest.json").unwrap().as_str(),
            "https://exemple.fr/abbon/releases/latest.json"
        );
        let root = server_base("https://exemple.fr").unwrap();
        assert_eq!(
            release_file(&root, "version.json").unwrap().as_str(),
            "https://exemple.fr/releases/version.json"
        );
    }
}
