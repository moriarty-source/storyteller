/**
 * Postgres adapter — used when POSTGRES_URL is set (Vercel + Neon).
 * Uses @neondatabase/serverless for HTTP-based, connection-pool-free queries.
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
import { neon } from "@neondatabase/serverless";
import { DEFAULT_CHARACTER, DEFAULT_WORLD, DEFAULT_STATIONS } from "./defaults";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRow(row: Record<string, any>): Story {
  return {
    code: row.code as string,
    status: row.status as StoryStatus,
    // Neon returns TEXT columns as strings; parse JSON
    character:
      typeof row.character === "string"
        ? (JSON.parse(row.character) as Character)
        : (row.character as Character),
    world:
      typeof row.world === "string"
        ? (JSON.parse(row.world) as World)
        : (row.world as World),
    inventory:
      typeof row.inventory === "string"
        ? (JSON.parse(row.inventory) as string[])
        : (row.inventory as string[]),
    stations:
      typeof row.stations === "string"
        ? (JSON.parse(row.stations) as Station[])
        : (row.stations as Station[]),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export class PostgresAdapter implements DbAdapter {
  private sql: ReturnType<typeof neon>;
  private initialized = false;

  constructor(url: string) {
    this.sql = neon(url);
  }

  private async ensureSchema(): Promise<void> {
    if (this.initialized) return;

    await this.sql`
      CREATE TABLE IF NOT EXISTS stories (
        code        TEXT PRIMARY KEY,
        status      TEXT NOT NULL DEFAULT 'active',
        character   TEXT NOT NULL DEFAULT '{}',
        world       TEXT NOT NULL DEFAULT '{}',
        inventory   TEXT NOT NULL DEFAULT '[]',
        stations    TEXT NOT NULL DEFAULT '[]',
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      )
    `;

    await this.sql`
      CREATE TABLE IF NOT EXISTS config (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `;

    // Seed defaults (ON CONFLICT DO NOTHING = safe to call repeatedly)
    await this.sql`
      INSERT INTO config (key, value)
      VALUES ('wordLimits', ${JSON.stringify(DEFAULT_WORD_LIMITS)})
      ON CONFLICT (key) DO NOTHING
    `;

    await this.sql`
      INSERT INTO config (key, value)
      VALUES ('adminPassword', ${JSON.stringify("admin")})
      ON CONFLICT (key) DO NOTHING
    `;

    this.initialized = true;
  }

  // ── Stories ────────────────────────────────────────────────────────────────

  async createStory(code: string): Promise<Story> {
    await this.ensureSchema();
    const now = new Date().toISOString();
    await this.sql`
      INSERT INTO stories (code, status, character, world, inventory, stations, created_at, updated_at)
      VALUES (
        ${code},
        'active',
        ${JSON.stringify(DEFAULT_CHARACTER)},
        ${JSON.stringify(DEFAULT_WORLD)},
        '[]',
        ${JSON.stringify(DEFAULT_STATIONS)},
        ${now},
        ${now}
      )
    `;
    return (await this.getStory(code))!;
  }

  async getStory(code: string): Promise<Story | null> {
    await this.ensureSchema();
    const rows = (await this.sql`SELECT * FROM stories WHERE code = ${code}`) as Record<string, unknown>[];
    if (!rows[0]) return null;
    return parseRow(rows[0]);
  }

  async updateStory(
    code: string,
    updates: Partial<
      Pick<Story, "character" | "world" | "inventory" | "stations" | "status">
    >
  ): Promise<Story | null> {
    await this.ensureSchema();
    if (Object.keys(updates).length === 0) return this.getStory(code);

    const now = new Date().toISOString();
    // COALESCE: param = null → keep current DB value; param = value → update it
    const status = updates.status ?? null;
    const character =
      updates.character !== undefined ? JSON.stringify(updates.character) : null;
    const world =
      updates.world !== undefined ? JSON.stringify(updates.world) : null;
    const inventory =
      updates.inventory !== undefined
        ? JSON.stringify(updates.inventory)
        : null;
    const stations =
      updates.stations !== undefined ? JSON.stringify(updates.stations) : null;

    await this.sql`
      UPDATE stories SET
        status     = COALESCE(${status},     status),
        character  = COALESCE(${character},  character),
        world      = COALESCE(${world},      world),
        inventory  = COALESCE(${inventory},  inventory),
        stations   = COALESCE(${stations},   stations),
        updated_at = ${now}
      WHERE code = ${code}
    `;

    return this.getStory(code);
  }

  async listStories(): Promise<Story[]> {
    await this.ensureSchema();
    const rows = (await this.sql`SELECT * FROM stories ORDER BY created_at DESC`) as Record<string, unknown>[];
    return rows.map((r) => parseRow(r));
  }

  async deleteStory(code: string): Promise<boolean> {
    await this.ensureSchema();
    const result = (await this.sql`DELETE FROM stories WHERE code = ${code} RETURNING code`) as unknown[];
    return result.length > 0;
  }

  async storyExists(code: string): Promise<boolean> {
    await this.ensureSchema();
    const rows = (await this.sql`SELECT 1 FROM stories WHERE code = ${code}`) as unknown[];
    return rows.length > 0;
  }

  // ── Config ─────────────────────────────────────────────────────────────────

  async getWordLimits(): Promise<WordLimits> {
    await this.ensureSchema();
    const rows = (await this.sql`SELECT value FROM config WHERE key = 'wordLimits'`) as { value: string }[];
    if (!rows[0]) return DEFAULT_WORD_LIMITS;
    return JSON.parse(rows[0].value) as WordLimits;
  }

  async setWordLimits(limits: WordLimits): Promise<void> {
    await this.ensureSchema();
    await this.sql`
      INSERT INTO config (key, value)
      VALUES ('wordLimits', ${JSON.stringify(limits)})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
  }

  async getAdminPassword(): Promise<string> {
    await this.ensureSchema();
    const rows = (await this.sql`SELECT value FROM config WHERE key = 'adminPassword'`) as { value: string }[];
    if (!rows[0]) return "admin";
    try {
      return JSON.parse(rows[0].value) as string;
    } catch {
      return rows[0].value;
    }
  }

  async setAdminPassword(password: string): Promise<void> {
    await this.ensureSchema();
    await this.sql`
      INSERT INTO config (key, value)
      VALUES ('adminPassword', ${JSON.stringify(password)})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
  }
}
