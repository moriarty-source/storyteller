/**
 * SQLite database via better-sqlite3.
 * Synchronous API — call getDb() from any server-side function.
 * Database file: data/stories.db (relative to project root on Pi, or DB_PATH env).
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { DEFAULT_WORD_LIMITS } from "@/types/story";
import { DEFAULT_SAGA_VARIABLES, DEFAULT_SAGA_TEXT_BLOCKS } from "@/data/saga-defaults";

const DB_PATH =
  process.env.DB_PATH ??
  path.join(process.cwd(), "data", "stories.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  // Ensure data directory exists
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stories (
      code        TEXT PRIMARY KEY,
      status      TEXT NOT NULL DEFAULT 'active',
      character   TEXT NOT NULL DEFAULT '{}',
      world       TEXT NOT NULL DEFAULT '{}',
      inventory   TEXT NOT NULL DEFAULT '[]',
      stations    TEXT NOT NULL DEFAULT '[]',
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saga_stories (
      code              TEXT PRIMARY KEY,
      status            TEXT NOT NULL DEFAULT 'active',
      character         TEXT NOT NULL,
      world             TEXT NOT NULL,
      inventory         TEXT NOT NULL DEFAULT '[]',
      stations          TEXT NOT NULL,
      variables         TEXT NOT NULL DEFAULT '{}',
      variable_snapshot TEXT NOT NULL DEFAULT '[]',
      created_at        TEXT NOT NULL,
      updated_at        TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saga_templates (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      category    TEXT NOT NULL,
      template    TEXT NOT NULL,
      conditions  TEXT NOT NULL DEFAULT '[]',
      updated_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saga_variable_definitions (
      key             TEXT PRIMARY KEY,
      label           TEXT NOT NULL,
      prompt          TEXT NOT NULL DEFAULT '',
      options         TEXT NOT NULL DEFAULT '[]',
      set_in_station  INTEGER NOT NULL DEFAULT 0,
      is_main_choice  INTEGER NOT NULL DEFAULT 0,
      updated_at      TEXT NOT NULL
    );
  `);

  // Seed default word limits
  const wl = db
    .prepare("SELECT key FROM config WHERE key = 'wordLimits'")
    .get();
  if (!wl) {
    db.prepare("INSERT INTO config (key, value) VALUES ('wordLimits', ?)").run(
      JSON.stringify(DEFAULT_WORD_LIMITS)
    );
  }

  // Seed default admin password
  const ap = db
    .prepare("SELECT key FROM config WHERE key = 'adminPassword'")
    .get();
  if (!ap) {
    db.prepare(
      "INSERT INTO config (key, value) VALUES ('adminPassword', ?)"
    ).run(JSON.stringify("admin"));
  }
  // Seed saga tables and defaults
  seedSagaIfEmpty(db);

function seedSagaIfEmpty(db: Database.Database): void {
  const varCount = db.prepare("SELECT COUNT(*) as c FROM saga_variable_definitions").get() as { c: number };
  if (varCount.c === 0) {
        const insert = db.prepare(
      `INSERT INTO saga_variable_definitions (key, label, prompt, options, set_in_station, is_main_choice, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const v of DEFAULT_SAGA_VARIABLES) {
      insert.run(v.key, v.label, v.prompt, JSON.stringify(v.options), v.setInStation, v.isMainChoice ? 1 : 0, v.updatedAt);
    }
  }
  const blockCount = db.prepare("SELECT COUNT(*) as c FROM saga_templates").get() as { c: number };
  if (blockCount.c === 0) {
    const insert = db.prepare(
      `INSERT INTO saga_templates (id, category, template, conditions, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    );
    for (const b of DEFAULT_SAGA_TEXT_BLOCKS) {
      insert.run(b.id, b.category, b.template, JSON.stringify(b.conditions), b.updatedAt);
    }
  }
}
}

/** No-op kept for any callers that import it — DB is initialised lazily on first getDb(). */
export function ensureDb(): void {
  getDb();
}
