import { Story, StoryStatus, Character, World, Station } from "@/types/story";
import { getDb } from "@/lib/db";

// Raw row shape from SQLite
interface StoryRow {
  code: string;
  status: string;
  character: string;
  world: string;
  inventory: string;
  stations: string;
  created_at: string;
  updated_at: string;
}

function rowToStory(row: StoryRow): Story {
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

export function createStory(code: string): Story {
  const db = getDb();
  db.prepare(`
    INSERT INTO stories (code, status, character, world, inventory, stations)
    VALUES (?, 'active', '{}', '{}', '[]', '[]')
  `).run(code);
  return getStory(code) as Story;
}

export function getStory(code: string): Story | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM stories WHERE code = ?")
    .get(code) as StoryRow | undefined;
  if (!row) return null;
  return rowToStory(row);
}

export function updateStory(
  code: string,
  updates: Partial<
    Pick<Story, "character" | "world" | "inventory" | "stations" | "status">
  >
): Story | null {
  const db = getDb();

  // Check existence first
  if (!storyExists(code)) return null;

  const setClauses: string[] = ["updated_at = datetime('now')"];
  const values: unknown[] = [];

  if (updates.status !== undefined) {
    setClauses.push("status = ?");
    values.push(updates.status);
  }
  if (updates.character !== undefined) {
    setClauses.push("character = ?");
    values.push(JSON.stringify(updates.character));
  }
  if (updates.world !== undefined) {
    setClauses.push("world = ?");
    values.push(JSON.stringify(updates.world));
  }
  if (updates.inventory !== undefined) {
    setClauses.push("inventory = ?");
    values.push(JSON.stringify(updates.inventory));
  }
  if (updates.stations !== undefined) {
    setClauses.push("stations = ?");
    values.push(JSON.stringify(updates.stations));
  }

  values.push(code);

  db.prepare(
    `UPDATE stories SET ${setClauses.join(", ")} WHERE code = ?`
  ).run(...values);

  return getStory(code);
}

export function listStories(): Story[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM stories ORDER BY created_at DESC")
    .all() as StoryRow[];
  return rows.map(rowToStory);
}

export function deleteStory(code: string): boolean {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM stories WHERE code = ?")
    .run(code);
  return result.changes > 0;
}

export function storyExists(code: string): boolean {
  const db = getDb();
  const row = db
    .prepare("SELECT 1 FROM stories WHERE code = ?")
    .get(code);
  return row !== undefined;
}
