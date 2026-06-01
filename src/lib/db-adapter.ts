/**
 * Database adapter factory.
 * Selects the right backend at runtime:
 *   POSTGRES_URL set  → Neon/Postgres (Vercel)
 *   POSTGRES_URL unset → SQLite / better-sqlite3 (Pi, local)
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

export function getAdapter(): DbAdapter {
  if (_adapter) return _adapter;

  if (process.env.POSTGRES_URL) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("./adapters/postgres") as {
      PostgresAdapter: new (url: string) => DbAdapter;
    };
    _adapter = new mod.PostgresAdapter(process.env.POSTGRES_URL);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("./adapters/sqlite") as {
      SqliteAdapter: new () => DbAdapter;
    };
    _adapter = new mod.SqliteAdapter();
  }

  return _adapter;
}
