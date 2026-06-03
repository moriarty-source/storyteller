/**
 * SQLite adapter — used when POSTGRES_URL is not set (Pi, local dev).
 * Wraps better-sqlite3 synchronous API in async-compatible interface.
 */

import type { DbAdapter } from "@/lib/db-adapter";
import type {
  Story,
  WordLimits,
  Character,
  World,
  Station,
  StoryStatus,
} from "@/types/story";
import { DEFAULT_WORD_LIMITS } from "@/types/story";
import { getDb } from "@/lib/db";

import { DEFAULT_CHARACTER, DEFAULT_WORLD, DEFAULT_STATIONS } from "./defaults";

function parseRow(row: Record<string, unknown>): Story {
  return {
    code: row.code as string,
    status: row.status as StoryStatus,
    character: JSON.parse(row.character as string) as Character,
    world: JSON.parse(row.world as string) as World,
    inventory: JSON.parse(row.inventory as string) as string[],
    stations: JSON.parse(row.stations as string) as Station[],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export class SqliteAdapter implements DbAdapter {
  async createStory(code: string): Promise<Story> {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO stories (code, status, character, world, inventory, stations, created_at, updated_at)
       VALUES (?, 'active', ?, ?, '[]', ?, ?, ?)`
    ).run(
      code,
      JSON.stringify(DEFAULT_CHARACTER),
      JSON.stringify(DEFAULT_WORLD),
      JSON.stringify(DEFAULT_STATIONS),
      now,
      now
    );
    return (await this.getStory(code))!;
  }

  async getStory(code: string): Promise<Story | null> {
    const db = getDb();
    const row = db
      .prepare("SELECT * FROM stories WHERE code = ?")
      .get(code) as Record<string, unknown> | undefined;
    return row ? parseRow(row) : null;
  }

  async updateStory(
    code: string,
    updates: Partial<
      Pick<Story, "character" | "world" | "inventory" | "stations" | "status">
    >
  ): Promise<Story | null> {
    const db = getDb();
    const parts: string[] = [];
    const values: unknown[] = [];

    if (updates.status !== undefined) {
      parts.push("status = ?");
      values.push(updates.status);
    }
    if (updates.character !== undefined) {
      parts.push("character = ?");
      values.push(JSON.stringify(updates.character));
    }
    if (updates.world !== undefined) {
      parts.push("world = ?");
      values.push(JSON.stringify(updates.world));
    }
    if (updates.inventory !== undefined) {
      parts.push("inventory = ?");
      values.push(JSON.stringify(updates.inventory));
    }
    if (updates.stations !== undefined) {
      parts.push("stations = ?");
      values.push(JSON.stringify(updates.stations));
    }

    if (parts.length === 0) return this.getStory(code);

    parts.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(code);

    db.prepare(
      `UPDATE stories SET ${parts.join(", ")} WHERE code = ?`
    ).run(...values);

    return this.getStory(code);
  }

  async listStories(): Promise<Story[]> {
    const db = getDb();
    const rows = db
      .prepare("SELECT * FROM stories ORDER BY created_at DESC")
      .all() as Record<string, unknown>[];
    return rows.map(parseRow);
  }

  async deleteStory(code: string): Promise<boolean> {
    const db = getDb();
    const result = db.prepare("DELETE FROM stories WHERE code = ?").run(code);
    return result.changes > 0;
  }

  async storyExists(code: string): Promise<boolean> {
    const db = getDb();
    return !!db.prepare("SELECT 1 FROM stories WHERE code = ?").get(code);
  }

  // ── Config ─────────────────────────────────────────────────────────────────

  async getWordLimits(): Promise<WordLimits> {
    const db = getDb();
    const row = db
      .prepare("SELECT value FROM config WHERE key = 'wordLimits'")
      .get() as { value: string } | undefined;
    if (!row) return DEFAULT_WORD_LIMITS;
    return JSON.parse(row.value) as WordLimits;
  }

  async setWordLimits(limits: WordLimits): Promise<void> {
    const db = getDb();
    db.prepare(
      "INSERT INTO config (key, value) VALUES ('wordLimits', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run(JSON.stringify(limits));
  }

  async getAdminPassword(): Promise<string> {
    const db = getDb();
    const row = db
      .prepare("SELECT value FROM config WHERE key = 'adminPassword'")
      .get() as { value: string } | undefined;
    if (!row) return "admin";
    try {
      return JSON.parse(row.value) as string;
    } catch {
      return row.value;
    }
  }

  async setAdminPassword(password: string): Promise<void> {
    const db = getDb();
    db.prepare(
      "INSERT INTO config (key, value) VALUES ('adminPassword', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run(JSON.stringify(password));
  }
}
