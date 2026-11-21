//! Écritures groupées dans une transaction SQLite.
//!
//! Le plugin SQL de Tauri répartit chaque appel sur un pool de connexions : un
//! `BEGIN` puis un `COMMIT` envoyés séparément ne sont pas garantis sur la même
//! connexion. Cette commande exécute toute une liste de requêtes sur une seule
//! connexion, dans une transaction : tout est écrit, ou rien.

use serde::Deserialize;
use serde_json::Value as JsonValue;
use sqlx::{Pool, Sqlite};
use tauri::State;
use tauri_plugin_sql::{DbInstances, DbPool};

/// Une requête avec ses paramètres (`$1, $2…`), comme pour `execute` du plugin.
#[derive(Debug, Deserialize)]
pub struct Statement {
    pub sql: String,
    #[serde(default)]
    pub params: Vec<JsonValue>,
}

/// Exécute les requêtes dans une transaction ; annule tout à la première erreur.
pub async fn run_statements(pool: &Pool<Sqlite>, statements: &[Statement]) -> Result<(), String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    for (i, st) in statements.iter().enumerate() {
        let mut query = sqlx::query(&st.sql);
        // Mêmes conversions que le plugin SQL, pour un comportement identique.
        for value in &st.params {
            query = match value {
                JsonValue::Null => query.bind(None::<String>),
                JsonValue::String(s) => query.bind(s.clone()),
                JsonValue::Number(n) => query.bind(n.as_f64().unwrap_or_default()),
                JsonValue::Bool(b) => query.bind(*b),
                other => query.bind(other.to_string()),
            };
        }
        if let Err(e) = query.execute(&mut *tx).await {
            // `tx` est abandonnée ici : sqlx annule la transaction.
            return Err(format!("requête {} : {e}", i + 1));
        }
    }
    tx.commit().await.map_err(|e| e.to_string())
}

/// Commande appelée par l'interface : `invoke('run_batch', { db, statements })`.
#[tauri::command]
pub async fn run_batch(
    instances: State<'_, DbInstances>,
    db: String,
    statements: Vec<Statement>,
) -> Result<(), String> {
    let pools = instances.0.read().await;
    match pools.get(&db) {
        Some(DbPool::Sqlite(pool)) => run_statements(pool, &statements).await,
        _ => Err(format!("base {db} non chargée")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn st(sql: &str, params: Vec<JsonValue>) -> Statement {
        Statement {
            sql: sql.into(),
            params,
        }
    }

    async fn pool() -> Pool<Sqlite> {
        // Une seule connexion : une base en mémoire n'est pas partagée entre connexions.
        let pool = sqlx::sqlite::SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .unwrap();
        sqlx::query("CREATE TABLE t (id TEXT PRIMARY KEY, n INTEGER, ok INTEGER, note TEXT)")
            .execute(&pool)
            .await
            .unwrap();
        pool
    }

    async fn count(pool: &Pool<Sqlite>) -> i64 {
        sqlx::query_scalar("SELECT count(*) FROM t")
            .fetch_one(pool)
            .await
            .unwrap()
    }

    #[test]
    fn commits_all_statements() {
        tauri::async_runtime::block_on(async {
            let pool = pool().await;
            let res = run_statements(
                &pool,
                &[
                    st(
                        "INSERT INTO t VALUES ($1, $2, $3, $4)",
                        vec![json!("a"), json!(1), json!(true), json!(null)],
                    ),
                    st(
                        "INSERT INTO t VALUES ($1, $2, $3, $4)",
                        vec![json!("b"), json!(2), json!(false), json!("x")],
                    ),
                ],
            )
            .await;
            assert!(res.is_ok(), "{res:?}");
            assert_eq!(count(&pool).await, 2);
        });
    }

    #[test]
    fn rolls_back_everything_on_error() {
        tauri::async_runtime::block_on(async {
            let pool = pool().await;
            let res = run_statements(
                &pool,
                &[
                    st("INSERT INTO t VALUES ($1, 1, 1, NULL)", vec![json!("a")]),
                    st("INSERT INTO t VALUES ($1, 1, 1, NULL)", vec![json!("a")]), // doublon
                ],
            )
            .await;
            assert!(res.unwrap_err().starts_with("requête 2"));
            assert_eq!(count(&pool).await, 0);
            // La connexion reste utilisable après l'annulation.
            run_statements(
                &pool,
                &[st("INSERT INTO t VALUES ('c', 1, 1, NULL)", vec![])],
            )
            .await
            .unwrap();
            assert_eq!(count(&pool).await, 1);
        });
    }
}
