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

import type { SagaStory, SagaTextBlock, SagaVariableDefinition } from "@/types/saga";

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

  // Saga: Stories
  createSagaStory(code: string, variableSnapshot: string): Promise<SagaStory>;
  getSagaStory(code: string): Promise<SagaStory | null>;
  updateSagaStory(
    code: string,
    updates: Partial<Pick<SagaStory, "character" | "world" | "inventory" | "stations" | "variables" | "status">>
  ): Promise<SagaStory | null>;
  listSagaStories(): Promise<SagaStory[]>;
  deleteSagaStory(code: string): Promise<boolean>;
  sagaStoryExists(code: string): Promise<boolean>;
  countSagaStoriesUsingVariable(key: string): Promise<number>;

  // Saga: Templates
  listSagaTemplates(): Promise<SagaTextBlock[]>;
  getSagaTemplate(id: number): Promise<SagaTextBlock | null>;
  createSagaTemplate(block: Omit<SagaTextBlock, "id" | "updatedAt">): Promise<SagaTextBlock>;
  updateSagaTemplate(id: number, block: Omit<SagaTextBlock, "id" | "updatedAt">): Promise<SagaTextBlock | null>;
  deleteSagaTemplate(id: number): Promise<boolean>;

  // Saga: Variable Definitions
  listSagaVariableDefinitions(): Promise<SagaVariableDefinition[]>;
  getSagaVariableDefinition(key: string): Promise<SagaVariableDefinition | null>;
  upsertSagaVariableDefinition(def: Omit<SagaVariableDefinition, "updatedAt">): Promise<SagaVariableDefinition>;
  deleteSagaVariableDefinition(key: string): Promise<boolean>;
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

export async function getAdapter(): Promise<DbAdapter> {
  if (_adapter) return _adapter;

  const pgUrl = getPostgresUrl();
  try {
    if (pgUrl) {
      const mod = await import("./adapters/postgres");
      _adapter = new mod.PostgresAdapter(pgUrl);
    } else {
      const mod = await import("./adapters/sqlite");
      _adapter = new mod.SqliteAdapter();
    }
  } catch (err) {
    console.error("Failed to load adapter:", err);
    throw err;
  }

  return _adapter;
}
