import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';

// Every test worker gets its own throwaway SQLite database built from the real migrations.
const directory = mkdtempSync(path.join(tmpdir(), 'cipher-lab-test-'));
const file = path.join(directory, 'test.db').replace(/\\/g, '/');

const migrations = path.resolve(import.meta.dirname, '../prisma/migrations');
const database = new Database(file);
for (const name of readdirSync(migrations).sort()) {
  if (name.endsWith('.toml')) continue;
  database.exec(readFileSync(path.join(migrations, name, 'migration.sql'), 'utf8'));
}
database.close();

process.env.DATABASE_URL = `file:${file}`;
