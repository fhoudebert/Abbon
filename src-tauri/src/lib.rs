//! Abbon — enveloppe Tauri.
//!
//! Le Rust reste volontairement minimal : la logique métier vit en TypeScript
//! (`src/lib/domain`). Ici on enregistre les plugins et les migrations SQLite.

mod batch;
mod update;

use tauri_plugin_sql::{Migration, MigrationKind};

/// Nom du fichier de base, relatif au répertoire de données de l'application.
pub const DB_URL: &str = "sqlite:abbon.db";

/// Migrations versionnées, appliquées dans l'ordre au chargement de la base.
/// Ne jamais modifier une migration publiée : en ajouter une nouvelle.
pub fn migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "schema_initial",
            sql: include_str!("../migrations/0001_init.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "attempt_snapshot",
            sql: include_str!("../migrations/0002_attempt_snapshot.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "media_in_db",
            sql: include_str!("../migrations/0003_media.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "modules",
            sql: include_str!("../migrations/0004_modules.sql"),
            kind: MigrationKind::Up,
        },
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();
    // Mises à jour : seulement sur ordinateur, et seulement si une clé publique a été fournie
    // à la compilation (sinon rien n'est vérifiable, donc rien n'est proposé).
    #[cfg(desktop)]
    let builder = match update::pubkey() {
        Some(key) => builder.plugin(tauri_plugin_updater::Builder::new().pubkey(key).build()),
        None => builder,
    };
    builder
        .plugin(tauri_plugin_opener::init())
        // Fenêtres « Enregistrer sous » ; le chemin choisi est ajouté à la portée du plugin fs.
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(DB_URL, migrations())
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            batch::run_batch,
            update::update_support,
            update::fetch_release,
            update::platform::check_update,
            update::platform::install_update
        ])
        .run(tauri::generate_context!())
        .expect("erreur au lancement d'Abbon");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn migrations_are_sequential() {
        for (i, m) in migrations().iter().enumerate() {
            assert_eq!(
                m.version,
                i as i64 + 1,
                "migration {} hors séquence",
                m.description
            );
        }
    }

    #[test]
    fn initial_schema_declares_core_tables() {
        let sql = migrations()[0].sql;
        for table in [
            "category", "quiz", "question", "choice", "attempt", "answer", "media", "setting",
        ] {
            assert!(
                sql.contains(&format!("CREATE TABLE IF NOT EXISTS {table} ")),
                "table {table} absente"
            );
        }
    }
}
