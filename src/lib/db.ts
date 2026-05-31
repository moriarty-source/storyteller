/**
 * SQLite database via better-sqlite3.
 * Synchronous API — call getDb() from any server-side function.
 * Database file: data/stories.db (relative to project root on Pi, or DB_PATH env).
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { DEFAULT_WORD_LIMITS } from "@/types/story";

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
}

/** No-op kept for any callers that import it — DB is initialised lazily on first getDb(). */
export function ensureDb(): void {
  getDb();
}
