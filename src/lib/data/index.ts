import { invoke, isTauri } from '@tauri-apps/api/core';
import { SITE } from '$lib/site';
import { MemoryRepository } from './memory';
import type { Repository } from './repository';
import { SqliteRepository, type SqlDriver } from './sqlite';

/** Doit correspondre à `DB_URL` dans `src-tauri/src/lib.rs`. */
export const DB_URL = 'sqlite:abbon.db';

let repo: Promise<Repository> | null = null;

/** Ouvre le stockage une seule fois : SQLite sous Tauri, mémoire dans un navigateur, stockage local dans le site web. */
export function getRepository(): Promise<Repository> {
  repo ??= open();
  return repo;
}

async function open(): Promise<Repository> {
  if (SITE) return (await import('./site')).openSite();
  if (!isTauri()) return new MemoryRepository();
  const { default: Database } = await import('@tauri-apps/plugin-sql');
  // Le chargement applique les migrations déclarées côté Rust.
  // sqlx active les clés étrangères (ON DELETE CASCADE) sur chaque connexion.
  const db = await Database.load(DB_URL);
  const driver: SqlDriver = {
    async execute(sql, params) {
      await db.execute(sql, params);
    },
    select: (sql, params) => db.select(sql, params),
    // Commande Rust `run_batch` : transaction sur une seule connexion (src-tauri/src/batch.rs).
    batch: (statements) => invoke('run_batch', { db: DB_URL, statements }),
  };
  return new SqliteRepository(driver);
}

export type { Repository } from './repository';
