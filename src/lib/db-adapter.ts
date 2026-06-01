/**
 * Database adapter factory.
 * Selects the right backend at runtime:
 *   Any Postgres URL found → Neon/Postgres (Vercel)
 *   No Postgres URL        → SQLite / better-sqlite3 (Pi, local)
 *
 * Checks env vars in priority order:
 *   POSTGRES_URL  — standard Neon/Vercel prefix
 *   STORAGE_URL   — Vercel Marketplace "STORAGE" prefix variant
 *   DATABASE_URL  — legacy / generic fallback
 */

import type { Story, WordLimits } from "@/types/story";

export interface DbAdapter {
  // Stories
  createStory(code: string): Promise<Story>;
  getStory(code: string): Promise<Story | null>;
  updateStory(
    code: string,
    updates: Partial<
      Pick<Story, "character" | "world" | "inventory" | "stations" | "status">
    >
  ): Promise<Story | null>;
  listStories(): Promise<Story[]>;
  deleteStory(code: string): Promise<boolean>;
  storyExists(code: string): Promise<boolean>;
  // Config
  getWordLimits(): Promise<WordLimits>;
  setWordLimits(limits: WordLimits): Promise<void>;
  getAdminPassword(): Promise<string>;
  setAdminPassword(password: string): Promise<void>;
}

let _adapter: DbAdapter | null = null;

/** Resolves the Postgres connection URL from any known env var name. */
function getPostgresUrl(): string | undefined {
  return (
    process.env.POSTGRES_URL ??
    process.env.STORAGE_URL ??
    process.env.DATABASE_URL
  );
}

export function getAdapter(): DbAdapter {
  if (_adapter) return _adapter;

  const pgUrl = getPostgresUrl();
  if (pgUrl) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("./adapters/postgres") as {
      PostgresAdapter: new (url: string) => DbAdapter;
    };
    _adapter = new mod.PostgresAdapter(pgUrl);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("./adapters/sqlite") as {
      SqliteAdapter: new () => DbAdapter;
    };
    _adapter = new mod.SqliteAdapter();
  }

  return _adapter;
}
