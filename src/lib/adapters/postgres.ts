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
import { DEFAULT_SAGA_CHARACTER, DEFAULT_SAGA_WORLD, DEFAULT_SAGA_STATIONS, type SagaStory, type SagaTextBlock, type SagaTextBlockCategory, type SagaVariableDefinition, type VariableSnapshotEntry } from "@/types/saga";

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

function parseSagaRow(row: Record<string, any>): SagaStory {
  return {
    code: row.code as string,
    mode: "saga",
    status: row.status as "active" | "completed",
    character: typeof row.character === "string" ? JSON.parse(row.character) as any : (row.character as any),
    world: typeof row.world === "string" ? JSON.parse(row.world) as any : (row.world as any),
    inventory: typeof row.inventory === "string" ? JSON.parse(row.inventory) as string[] : (row.inventory as string[]),
    stations: typeof row.stations === "string" ? JSON.parse(row.stations) as any : (row.stations as any),
    variables: typeof row.variables === "string" ? JSON.parse(row.variables) as Record<string, string | number | boolean> : (row.variables as Record<string, string | number | boolean>),
    variableSnapshot: typeof row.variable_snapshot === "string" ? JSON.parse(row.variable_snapshot) as VariableSnapshotEntry[] : (row.variable_snapshot as VariableSnapshotEntry[]),
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

  // ── Saga: Stories ─────────────────────────────────────────────────────────

  async createSagaStory(code: string, variableSnapshot: string): Promise<SagaStory> {
    await this.ensureSchema();
    const now = new Date().toISOString();
    await this.sql`
      INSERT INTO saga_stories (code, status, character, world, inventory, stations, variables, variable_snapshot, created_at, updated_at)
      VALUES (
        ${code},
        'active',
        ${JSON.stringify(DEFAULT_SAGA_CHARACTER)},
        ${JSON.stringify(DEFAULT_SAGA_WORLD)},
        '[]',
        ${JSON.stringify(DEFAULT_SAGA_STATIONS)},
        '{}',
        ${variableSnapshot},
        ${now},
        ${now}
      )
    `;
    return await this.getSagaStory(code);
  }

  async getSagaStory(code: string): Promise<SagaStory | null> {
    await this.ensureSchema();
    const rows = await this.sql`SELECT * FROM saga_stories WHERE code = ${code}` as Record<string, unknown>[];
    if (!rows[0]) return null;
    return parseSagaRow(rows[0]);
  }

  async updateSagaStory(
    code: string,
    updates: Partial<Pick<SagaStory, "character" | "world" | "inventory" | "stations" | "variables" | "status">>
  ): Promise<SagaStory | null> {
    await this.ensureSchema();
    const now = new Date().toISOString();
    await this.sql`
      UPDATE saga_stories SET
        status = COALESCE(${updates.status ?? null}, status),
        character = COALESCE(${updates.character !== undefined ? JSON.stringify(updates.character) : null}, character),
        world = COALESCE(${updates.world !== undefined ? JSON.stringify(updates.world) : null}, world),
        inventory = COALESCE(${updates.inventory !== undefined ? JSON.stringify(updates.inventory) : null}, inventory),
        stations = COALESCE(${updates.stations !== undefined ? JSON.stringify(updates.stations) : null}, stations),
        variables = COALESCE(${updates.variables !== undefined ? JSON.stringify(updates.variables) : null}, variables),
        updated_at = ${now}
      WHERE code = ${code}
    `;
    return await this.getSagaStory(code);
  }

  async listSagaStories(): Promise<SagaStory[]> {
    await this.ensureSchema();
    const rows = await this.sql`SELECT * FROM saga_stories ORDER BY created_at DESC` as Record<string, unknown>[];
    return rows.map(parseSagaRow);
  }

  async deleteSagaStory(code: string): Promise<boolean> {
    await this.ensureSchema();
    const result = await this.sql`DELETE FROM saga_stories WHERE code = ${code} RETURNING code` as unknown[];
    return result.length > 0;
  }

  async sagaStoryExists(code: string): Promise<boolean> {
    await this.ensureSchema();
    const rows = await this.sql`SELECT 1 FROM saga_stories WHERE code = ${code}` as unknown[];
    return rows.length > 0;
  }

  async countSagaStoriesUsingVariable(key: string): Promise<number> {
    await this.ensureSchema();
    const rows = await this.sql`SELECT variable_snapshot FROM saga_stories` as { variable_snapshot: string }[];
    let n = 0;
    for (const r of rows) {
      const snap = JSON.parse(r.variable_snapshot) as VariableSnapshotEntry[];
      if (snap.some(e => e.key === key)) n++;
    }
    return n;
  }

  // ── Saga: Templates ──────────────────────────────────────────────────────

  async listSagaTemplates(): Promise<SagaTextBlock[]> {
    await this.ensureSchema();
    const rows = await this.sql`SELECT * FROM saga_templates ORDER BY id ASC` as Record<string, unknown>[];
    return rows.map(row => ({
      id: row.id as number,
      category: row.category as SagaTextBlockCategory,
      template: row.template as string,
      conditions: JSON.parse(row.conditions as string),
      updatedAt: row.updated_at as string,
    }));
  }

  async getSagaTemplate(id: number): Promise<SagaTextBlock | null> {
    await this.ensureSchema();
    const rows = await this.sql`SELECT * FROM saga_templates WHERE id = ${id}` as Record<string, unknown>[];
    if (!rows[0]) return null;
    const row = rows[0];
    return {
      id: row.id as number,
      category: row.category as SagaTextBlockCategory,
      template: row.template as string,
      conditions: JSON.parse(row.conditions as string),
      updatedAt: row.updated_at as string,
    };
  }

  async createSagaTemplate(block: Omit<SagaTextBlock, "id" | "updatedAt">): Promise<SagaTextBlock> {
    await this.ensureSchema();
    const now = new Date().toISOString();
    const result = await this.sql`
      INSERT INTO saga_templates (category, template, conditions, updated_at)
      VALUES (${block.category}, ${block.template}, ${JSON.stringify(block.conditions)}, ${now})
      RETURNING id
    ` as { id: number }[];
    const id = result[0].id;
    return { id, category: block.category, template: block.template, conditions: block.conditions, updatedAt: now };
  }

  async updateSagaTemplate(id: number, block: Omit<SagaTextBlock, "id" | "updatedAt">): Promise<SagaTextBlock | null> {
    await this.ensureSchema();
    const now = new Date().toISOString();
    await this.sql`
      UPDATE saga_templates SET category = ${block.category}, template = ${block.template}, conditions = ${JSON.stringify(block.conditions)}, updated_at = ${now} WHERE id = ${id}
    `;
    return await this.getSagaTemplate(id);
  }

  async deleteSagaTemplate(id: number): Promise<boolean> {
    await this.ensureSchema();
    const result = await this.sql`DELETE FROM saga_templates WHERE id = ${id} RETURNING id` as unknown[];
    return result.length > 0;
  }

  // ── Saga: Variable Definitions ──────────────────────────────────────────

  async listSagaVariableDefinitions(): Promise<SagaVariableDefinition[]> {
    await this.ensureSchema();
    const rows = await this.sql`SELECT * FROM saga_variable_definitions ORDER BY set_in_station ASC, key ASC` as Record<string, unknown>[];
    return rows.map(row => ({
      key: row.key as string,
      label: row.label as string,
      prompt: row.prompt as string,
      options: JSON.parse(row.options as string),
      setInStation: row.set_in_station as number,
      isMainChoice: (row.is_main_choice as number) === 1,
      updatedAt: row.updated_at as string,
    }));
  }

  async getSagaVariableDefinition(key: string): Promise<SagaVariableDefinition | null> {
    await this.ensureSchema();
    const rows = await this.sql`SELECT * FROM saga_variable_definitions WHERE key = ${key}` as Record<string, unknown>[];
    if (!rows[0]) return null;
    const row = rows[0];
    return {
      key: row.key as string,
      label: row.label as string,
      prompt: row.prompt as string,
      options: JSON.parse(row.options as string),
      setInStation: row.set_in_station as number,
      isMainChoice: (row.is_main_choice as number) === 1,
      updatedAt: row.updated_at as string,
    };
  }

  async upsertSagaVariableDefinition(def: Omit<SagaVariableDefinition, "updatedAt">): Promise<SagaVariableDefinition> {
    await this.ensureSchema();
    const now = new Date().toISOString();
    await this.sql`
      INSERT INTO saga_variable_definitions (key, label, prompt, options, set_in_station, is_main_choice, updated_at)
      VALUES (${def.key}, ${def.label}, ${def.prompt}, ${JSON.stringify(def.options)}, ${def.setInStation}, ${def.isMainChoice ? 1 : 0}, ${now})
      ON CONFLICT (key) DO UPDATE SET
        label = EXCLUDED.label,
        prompt = EXCLUDED.prompt,
        options = EXCLUDED.options,
        set_in_station = EXCLUDED.set_in_station,
        is_main_choice = EXCLUDED.is_main_choice,
        updated_at = EXCLUDED.updated_at
    `;
    return (await this.getSagaVariableDefinition(def.key))!;
  }

  async deleteSagaVariableDefinition(key: string): Promise<boolean> {
    await this.ensureSchema();
    const result = await this.sql`DELETE FROM saga_variable_definitions WHERE key = ${key} RETURNING key` as unknown[];
    return result.length > 0;
  }

}
