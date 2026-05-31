import { sql } from "@vercel/postgres";
import type { Story, StoryStatus, Character, World, Station } from "@/types/story";
import { STATIONS } from "@/types/story";

const DEFAULT_CHARACTER: Character = {
  name: "",
  strength: "Mutig",
  weakness: "",
  goal: "",
  secret: "",
};

const DEFAULT_WORLD: World = {
  description: "",
  problem: "",
};

const DEFAULT_STATIONS: Station[] = STATIONS.map((s) => ({
  id: s.id,
  text: "",
  choices: [],
  completed: false,
}));

export async function createStory(code: string): Promise<Story> {
  const now = new Date().toISOString();
  
  await sql`
    INSERT INTO stories (code, status, character, world, inventory, stations, created_at, updated_at)
    VALUES (
      ${code}, 
      'active', 
      ${JSON.stringify(DEFAULT_CHARACTER)}::jsonb, 
      ${JSON.stringify(DEFAULT_WORLD)}::jsonb, 
      '[]'::jsonb, 
      ${JSON.stringify(DEFAULT_STATIONS)}::jsonb,
      ${now},
      ${now}
    )
  `;
  
  return getStory(code) as Promise<Story>;
}

export async function getStory(code: string): Promise<Story | null> {
  const result = await sql`
    SELECT * FROM stories WHERE code = ${code}
  `;
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0] as any;
  return {
    code: row.code,
    status: row.status as StoryStatus,
    character: JSON.parse(row.character),
    world: JSON.parse(row.world),
    inventory: JSON.parse(row.inventory),
    stations: JSON.parse(row.stations),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function updateStory(
  code: string,
  updates: Partial<Pick<Story, "character" | "world" | "inventory" | "stations" | "status">>
): Promise<Story | null> {
  // Check existence first
  const existing = await getStory(code);
  if (!existing) return null;

  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.status !== undefined) {
    setClauses.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }
  if (updates.character !== undefined) {
    setClauses.push(`character = $${paramIndex++}::jsonb`);
    values.push(JSON.stringify(updates.character));
  }
  if (updates.world !== undefined) {
    setClauses.push(`world = $${paramIndex++}::jsonb`);
    values.push(JSON.stringify(updates.world));
  }
  if (updates.inventory !== undefined) {
    setClauses.push(`inventory = $${paramIndex++}::jsonb`);
    values.push(JSON.stringify(updates.inventory));
  }
  if (updates.stations !== undefined) {
    setClauses.push(`stations = $${paramIndex++}::jsonb`);
    values.push(JSON.stringify(updates.stations));
  }

  setClauses.push(`updated_at = NOW()`);
  values.push(code);

  await sql.query(`
    UPDATE stories 
    SET ${setClauses.join(", ")} 
    WHERE code = $${paramIndex}
  `, values);

  return getStory(code);
}

export async function listStories(): Promise<Story[]> {
  const result = await sql`
    SELECT * FROM stories ORDER BY created_at DESC
  `;
  
  return result.rows.map((row: any) => ({
    code: row.code,
    status: row.status as StoryStatus,
    character: JSON.parse(row.character),
    world: JSON.parse(row.world),
    inventory: JSON.parse(row.inventory),
    stations: JSON.parse(row.stations),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function deleteStory(code: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM stories WHERE code = ${code}
  `;
  return result.rowCount !== null && result.rowCount > 0;
}

export async function storyExists(code: string): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM stories WHERE code = ${code}
  `;
  return result.rows.length > 0;
}

export async function initDatabase(): Promise<void> {
  // Create stories table if not exists
  await sql`
    CREATE TABLE IF NOT EXISTS stories (
      code TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'active',
      character JSONB NOT NULL DEFAULT '{}',
      world JSONB NOT NULL DEFAULT '{}',
      inventory JSONB NOT NULL DEFAULT '[]',
      stations JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  // Create config table if not exists
  await sql`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL
    )
  `;

  // Seed default config if not present
  const existingConfig = await sql`
    SELECT key FROM config WHERE key = 'word_limits'
  `;
  
  if (existingConfig.rows.length === 0) {
    const { DEFAULT_WORD_LIMITS } = await import("@/types/story");
    await sql`
      INSERT INTO config (key, value) 
      VALUES ('word_limits', ${JSON.stringify(DEFAULT_WORD_LIMITS)}::jsonb)
    `;
  }

  const existingPw = await sql`
    SELECT key FROM config WHERE key = 'admin_password'
  `;
  
  if (existingPw.rows.length === 0) {
    await sql`
      INSERT INTO config (key, value) 
      VALUES ('admin_password', ${JSON.stringify("workshop2024")}::jsonb)
    `;
  }
}