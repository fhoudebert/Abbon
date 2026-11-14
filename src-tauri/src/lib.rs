//! Abbon — enveloppe Tauri.
//!
//! Le Rust reste volontairement minimal : la logique métier vit en TypeScript
//! (`src/lib/domain`). Ici on enregistre les plugins et les migrations SQLite.

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
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(DB_URL, migrations())
                .build(),
        )
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
