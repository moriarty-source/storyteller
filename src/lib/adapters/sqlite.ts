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
import {
  DEFAULT_SAGA_CHARACTER,
  DEFAULT_SAGA_WORLD,
  DEFAULT_SAGA_STATIONS,
  type SagaStory,
  type SagaTextBlock,
  type SagaTextBlockCategory,
  type SagaVariableDefinition,
  type VariableSnapshotEntry,
} from "@/types/saga";

function parseRow(row: Record<string, unknown>): Story {
  let character: Character;
  try {
    character = JSON.parse(row.character as string) as Character;
    if (!character || typeof character !== "object") character = DEFAULT_CHARACTER;
  } catch {
    character = DEFAULT_CHARACTER;
  }

  let world: World;
  try {
    world = JSON.parse(row.world as string) as World;
    if (!world || typeof world !== "object") world = DEFAULT_WORLD;
  } catch {
    world = DEFAULT_WORLD;
  }

  let inventory: string[];
  try {
    inventory = JSON.parse(row.inventory as string) as string[];
    if (!Array.isArray(inventory)) inventory = [];
  } catch {
    inventory = [];
  }

  let stations: Station[];
  try {
    stations = JSON.parse(row.stations as string) as Station[];
    if (!Array.isArray(stations)) stations = DEFAULT_STATIONS;
  } catch {
    stations = DEFAULT_STATIONS;
  }

  return {
    code: row.code as string,
    status: row.status as StoryStatus,
    character,
    world,
    inventory,
    stations,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function parseSagaRow(row: Record<string, unknown>): SagaStory {
  let character: unknown;
  try {
    character = typeof row.character === "string" ? JSON.parse(row.character as string) : row.character;
  } catch {
    character = DEFAULT_SAGA_CHARACTER;
  }

  let world: unknown;
  try {
    world = typeof row.world === "string" ? JSON.parse(row.world as string) : row.world;
  } catch {
    world = DEFAULT_SAGA_WORLD;
  }

  let inventory: string[];
  try {
    inventory = typeof row.inventory === "string" ? JSON.parse(row.inventory as string) : row.inventory;
    if (!Array.isArray(inventory)) inventory = [];
  } catch {
    inventory = [];
  }

  let stations: unknown;
  try {
    stations = typeof row.stations === "string" ? JSON.parse(row.stations as string) : row.stations;
  } catch {
    stations = DEFAULT_SAGA_STATIONS;
  }

  let variables: Record<string, string | number | boolean>;
  try {
    variables = typeof row.variables === "string" ? JSON.parse(row.variables as string) : row.variables;
    if (!variables || typeof variables !== "object") variables = {};
  } catch {
    variables = {};
  }

  let variableSnapshot: VariableSnapshotEntry[];
  try {
    variableSnapshot = typeof row.variable_snapshot === "string" ? JSON.parse(row.variable_snapshot as string) : row.variable_snapshot;
    if (!Array.isArray(variableSnapshot)) variableSnapshot = [];
  } catch {
    variableSnapshot = [];
  }

  return {
    code: row.code as string,
    mode: "saga",
    status: row.status as "active" | "completed",
    character: (character as SagaStory["character"]) ?? DEFAULT_SAGA_CHARACTER,
    world: (world as SagaStory["world"]) ?? DEFAULT_SAGA_WORLD,
    inventory,
    stations: (stations as SagaStory["stations"]) ?? DEFAULT_SAGA_STATIONS,
    variables,
    variableSnapshot,
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
    try {
      const parsed = JSON.parse(row.value);
      if (parsed && typeof parsed === "object") {
        if ("wordLimits" in parsed && parsed.wordLimits && typeof parsed.wordLimits === "object") {
          return parsed.wordLimits as WordLimits;
        }
        return parsed as WordLimits;
      }
      return DEFAULT_WORD_LIMITS;
    } catch {
      return DEFAULT_WORD_LIMITS;
    }
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

  // ── Saga: Stories ─────────────────────────────────────────────────────────

  async createSagaStory(code: string, variableSnapshot: string): Promise<SagaStory> {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO saga_stories (code, status, character, world, inventory, stations, variables, variable_snapshot, created_at, updated_at)
       VALUES (?, 'active', ?, ?, '[]', ?, ?, ?, ?, ?)`
    ).run(
      code,
      JSON.stringify(DEFAULT_SAGA_CHARACTER),
      JSON.stringify(DEFAULT_SAGA_WORLD),
      '[]',
      JSON.stringify(DEFAULT_SAGA_STATIONS),
      '{}',
      variableSnapshot,
      now,
      now
    );
    return (await this.getSagaStory(code))!;
  }

  async getSagaStory(code: string): Promise<SagaStory | null> {
    const db = getDb();
    const row = db.prepare("SELECT * FROM saga_stories WHERE code = ?").get(code) as Record<string, unknown> | undefined;
    return row ? parseSagaRow(row) : null;
  }

  async updateSagaStory(
    code: string,
    updates: Partial<Pick<SagaStory, "character" | "world" | "inventory" | "stations" | "variables" | "status">>
  ): Promise<SagaStory | null> {
    const db = getDb();
    const parts: string[] = [];
    const values: unknown[] = [];

    if (updates.status !== undefined) { parts.push("status = ?"); values.push(updates.status); }
    if (updates.character !== undefined) { parts.push("character = ?"); values.push(JSON.stringify(updates.character)); }
    if (updates.world !== undefined) { parts.push("world = ?"); values.push(JSON.stringify(updates.world)); }
    if (updates.inventory !== undefined) { parts.push("inventory = ?"); values.push(JSON.stringify(updates.inventory)); }
    if (updates.stations !== undefined) { parts.push("stations = ?"); values.push(JSON.stringify(updates.stations)); }
    if (updates.variables !== undefined) { parts.push("variables = ?"); values.push(JSON.stringify(updates.variables)); }

    if (parts.length === 0) return this.getSagaStory(code);

    parts.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(code);

    db.prepare(`UPDATE saga_stories SET ${parts.join(", ")} WHERE code = ?`).run(...values);
    return this.getSagaStory(code);
  }

  async listSagaStories(): Promise<SagaStory[]> {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM saga_stories ORDER BY created_at DESC").all() as Record<string, unknown>[];
    return rows.map(parseSagaRow);
  }

  async deleteSagaStory(code: string): Promise<boolean> {
    const db = getDb();
    const result = db.prepare("DELETE FROM saga_stories WHERE code = ?").run(code);
    return result.changes > 0;
  }

  async sagaStoryExists(code: string): Promise<boolean> {
    const db = getDb();
    return !!db.prepare("SELECT 1 FROM saga_stories WHERE code = ?").get(code);
  }

  async countSagaStoriesUsingVariable(key: string): Promise<number> {
    const db = getDb();
    const rows = db.prepare("SELECT variable_snapshot FROM saga_stories").all() as { variable_snapshot: string }[];
    let n = 0;
    for (const r of rows) {
      const snap = JSON.parse(r.variable_snapshot) as VariableSnapshotEntry[];
      if (snap.some(e => e.key === key)) n++;
    }
    return n;
  }

  // ── Saga: Templates ──────────────────────────────────────────────────────

  async listSagaTemplates(): Promise<SagaTextBlock[]> {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM saga_templates ORDER BY id ASC").all() as Record<string, unknown>[];
    return rows.map(row => ({
      id: row.id as number,
      category: row.category as SagaTextBlockCategory,
      template: row.template as string,
      conditions: JSON.parse(row.conditions as string),
      updatedAt: row.updated_at as string,
    }));
  }

  async getSagaTemplate(id: number): Promise<SagaTextBlock | null> {
    const db = getDb();
    const row = db.prepare("SELECT * FROM saga_templates WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: row.id as number,
      category: row.category as SagaTextBlockCategory,
      template: row.template as string,
      conditions: JSON.parse(row.conditions as string),
      updatedAt: row.updated_at as string,
    };
  }

  async createSagaTemplate(block: Omit<SagaTextBlock, "id" | "updatedAt">): Promise<SagaTextBlock> {
    const db = getDb();
    const now = new Date().toISOString();
    const result = db.prepare(
      `INSERT INTO saga_templates (category, template, conditions, updated_at) VALUES (?, ?, ?, ?)`
    ).run(block.category, block.template, JSON.stringify(block.conditions), now);
    return {
      id: result.lastInsertRowid as number,
      category: block.category,
      template: block.template,
      conditions: block.conditions,
      updatedAt: now,
    };
  }

  async updateSagaTemplate(id: number, block: Omit<SagaTextBlock, "id" | "updatedAt">): Promise<SagaTextBlock | null> {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(
      `UPDATE saga_templates SET category = ?, template = ?, conditions = ?, updated_at = ? WHERE id = ?`
    ).run(block.category, block.template, JSON.stringify(block.conditions), now, id);
    return this.getSagaTemplate(id);
  }

  async deleteSagaTemplate(id: number): Promise<boolean> {
    const db = getDb();
    const result = db.prepare("DELETE FROM saga_templates WHERE id = ?").run(id);
    return result.changes > 0;
  }

  // ── Saga: Variable Definitions ──────────────────────────────────────────

  async listSagaVariableDefinitions(): Promise<SagaVariableDefinition[]> {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM saga_variable_definitions ORDER BY set_in_station ASC, key ASC").all() as Record<string, unknown>[];
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
    const db = getDb();
    const row = db.prepare("SELECT * FROM saga_variable_definitions WHERE key = ?").get(key) as Record<string, unknown> | undefined;
    if (!row) return null;
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
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO saga_variable_definitions (key, label, prompt, options, set_in_station, is_main_choice, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         label = excluded.label,
         prompt = excluded.prompt,
         options = excluded.options,
         set_in_station = excluded.set_in_station,
         is_main_choice = excluded.is_main_choice,
         updated_at = excluded.updated_at`
    ).run(
      def.key,
      def.label,
      def.prompt,
      JSON.stringify(def.options),
      def.setInStation,
      def.isMainChoice ? 1 : 0,
      now
    );
    return (await this.getSagaVariableDefinition(def.key))!;
  }

  async deleteSagaVariableDefinition(key: string): Promise<boolean> {
    const db = getDb();
    const result = db.prepare("DELETE FROM saga_variable_definitions WHERE key = ?").run(key);
    return result.changes > 0;
  }

}

