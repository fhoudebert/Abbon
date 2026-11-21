/**
 * Pilote SQL des tests : le vrai SQL du dépôt (migrations + requêtes) sur le SQLite intégré à Node.
 */
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { SqlDriver } from './sqlite';

const migrationsDir = new URL('../../../src-tauri/migrations/', import.meta.url);
export const MIGRATIONS = ['0001_init.sql', '0002_attempt_snapshot.sql', '0003_media.sql', '0004_modules.sql', '0005_typed_answers.sql', '0006_cloze.sql', '0007_leitner.sql', '0008_rewards.sql'];

/** Convertit `$1` (syntaxe du plugin Tauri / sqlx) en `?1` (SQLite natif). */
const toNative = (sql: string) => sql.replace(/\$(\d+)/g, '?$1');

export function nodeDriver(): SqlDriver {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const file of MIGRATIONS) db.exec(readFileSync(new URL(file, migrationsDir), 'utf8'));
  return {
    async execute(sql, params = []) {
      db.prepare(toNative(sql)).run(...(params as never[]));
    },
    async select(sql, params = []) {
      return db.prepare(toNative(sql)).all(...(params as never[])) as never[];
    },
    async batch(statements) {
      db.exec('BEGIN');
      try {
        for (const st of statements) db.prepare(toNative(st.sql)).run(...(st.params as never[]));
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };
}
