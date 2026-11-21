/**
 * Les JSON Schema publiés dans docs/format-qcm/ doivent refléter les schémas du code.
 * Pour les régénérer : npm run schema
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { jsonSchemas } from './format';
import { moduleJsonSchema } from './module';

const dir = new URL('../../../docs/format-qcm/', import.meta.url);

describe('documentation du format', () => {
  for (const [name, schema] of Object.entries({ ...jsonSchemas(), module: moduleJsonSchema() })) {
    it(`${name}.schema.json est à jour`, () => {
      const file = new URL(`${name}.schema.json`, dir);
      const text = JSON.stringify(schema, null, 2) + '\n';
      if (process.env.UPDATE_SCHEMA) writeFileSync(file, text);
      expect(existsSync(file), 'lancer « npm run schema »').toBe(true);
      expect(readFileSync(file, 'utf8')).toBe(text);
    });
  }
});
