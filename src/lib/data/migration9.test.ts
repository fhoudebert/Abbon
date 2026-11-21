import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { MIGRATIONS } from './sqlite.testing';

const dir = new URL('../../../src-tauri/migrations/', import.meta.url);
const sql = (file: string) => readFileSync(new URL(file, dir), 'utf8');

describe('migration 9 (types de question)', () => {
  it('reconstruit question et choice sans rien perdre, cascades comprises', () => {
    const db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON');
    const before = MIGRATIONS.filter((f) => f < '0009');
    for (const f of before) db.exec(sql(f));
    const now = '2026-11-21T10:00:00.000Z';
    db.exec(`INSERT INTO quiz (id, title, created_at, updated_at) VALUES ('q1', '{}', '${now}', '${now}'), ('q2', '{}', '${now}', '${now}')`);
    db.exec(`INSERT INTO question (id, quiz_id, type, prompt, points, position, explanation, expected) VALUES
      ('a', 'q1', 'single', '{"fr":1}', 2, 0, '{"fr":"e"}', NULL),
      ('b', 'q1', 'numeric', '{}', 1, 1, NULL, '{"value":5}'),
      ('c', 'q2', 'cloze', '{}', 1, 0, NULL, '{"gaps":[]}')`);
    db.exec(`INSERT INTO choice (id, question_id, content, correct, position, feedback) VALUES
      ('a1', 'a', '{"fr":"x"}', 1, 0, '{"fr":"f"}'), ('a2', 'a', '{}', 0, 1, NULL)`);
    expect(() => db.exec(`INSERT INTO question (id, quiz_id, type, prompt) VALUES ('z', 'q1', 'expression', '{}')`)).toThrow(/CHECK/);
    const questions = db.prepare('SELECT * FROM question ORDER BY id').all();
    const choices = db.prepare('SELECT * FROM choice ORDER BY id').all();

    db.exec('BEGIN');
    db.exec(sql('0009_question_types.sql'));
    db.exec('COMMIT');

    expect(db.prepare('SELECT * FROM question ORDER BY id').all()).toEqual(questions);
    expect(db.prepare('SELECT * FROM choice ORDER BY id').all()).toEqual(choices);
    // Nouveau type accepté ; clés étrangères et index en place.
    db.exec(`INSERT INTO question (id, quiz_id, type, prompt, expected) VALUES ('d', 'q1', 'expression', '{}', '{"latex":"3x^2"}')`);
    expect(() => db.exec(`INSERT INTO choice (id, question_id, content) VALUES ('x', 'nope', '{}')`)).toThrow(/FOREIGN KEY/);
    const fk = db.prepare("SELECT \"table\" FROM pragma_foreign_key_list('choice')").all() as { table: string }[];
    expect(fk.map((r) => r.table)).toEqual(['question']);
    const idx = (db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%' ORDER BY name").all() as { name: string }[]).map((r) => r.name);
    expect(idx).toEqual(expect.arrayContaining(['idx_choice_question', 'idx_question_quiz']));
    // Supprimer un QCM supprime ses questions et leurs choix.
    db.exec("DELETE FROM quiz WHERE id = 'q1'");
    expect(db.prepare('SELECT id FROM question ORDER BY id').all()).toEqual([{ id: 'c' }]);
    expect(db.prepare('SELECT COUNT(*) AS n FROM choice').get()).toEqual({ n: 0 });
    expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
  });
});
