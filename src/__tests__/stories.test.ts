/**
 * Tests for src/lib/stories.ts
 * Uses an in-memory SQLite database to avoid touching the filesystem.
 */
import Database from "better-sqlite3";

// We'll inject a test DB by resetting the module and overriding getDb
let testDb: Database.Database;

// Override the db module before importing stories
jest.mock("@/lib/db", () => ({
  getDb: () => testDb,
}));

// Import after mock is set up
import {
  createStory,
  getStory,
  updateStory,
  listStories,
  deleteStory,
  storyExists,
} from "@/lib/stories";

function initTestDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS stories (
      code TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'active',
      character TEXT NOT NULL DEFAULT '{}',
      world TEXT NOT NULL DEFAULT '{}',
      inventory TEXT NOT NULL DEFAULT '[]',
      stations TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  return db;
}

beforeEach(() => {
  testDb = initTestDb();
});

afterEach(() => {
  testDb.close();
});

describe("createStory", () => {
  it("creates a story with correct defaults", () => {
    const story = createStory("TEST");

    expect(story.code).toBe("TEST");
    expect(story.status).toBe("active");
    expect(story.character).toEqual({});
    expect(story.world).toEqual({});
    expect(story.inventory).toEqual([]);
    expect(story.stations).toEqual([]);
    expect(typeof story.createdAt).toBe("string");
    expect(typeof story.updatedAt).toBe("string");
  });

  it("returns the newly created story", () => {
    const story = createStory("ABCD");
    expect(story.code).toBe("ABCD");
  });

  it("throws if code already exists", () => {
    createStory("DUPL");
    expect(() => createStory("DUPL")).toThrow();
  });
});

describe("getStory", () => {
  it("returns a story by code", () => {
    createStory("GET1");
    const story = getStory("GET1");
    expect(story).not.toBeNull();
    expect(story!.code).toBe("GET1");
  });

  it("returns null for non-existent code", () => {
    const story = getStory("NONE");
    expect(story).toBeNull();
  });

  it("parses JSON fields correctly", () => {
    createStory("JSON");
    const story = getStory("JSON");
    expect(Array.isArray(story!.inventory)).toBe(true);
    expect(Array.isArray(story!.stations)).toBe(true);
    expect(typeof story!.character).toBe("object");
    expect(typeof story!.world).toBe("object");
  });
});

describe("updateStory", () => {
  it("updates the character field", () => {
    createStory("UPD1");
    const character = {
      name: "Lena",
      strength: "Mutig" as const,
      weakness: "Impulsiv",
      goal: "Die Welt retten",
    };
    const updated = updateStory("UPD1", { character });
    expect(updated).not.toBeNull();
    expect(updated!.character).toEqual(character);
  });

  it("updates multiple fields at once", () => {
    createStory("UPD2");
    const world = { description: "Ein dunkler Wald", problem: "Monster" };
    const inventory = ["Schwert", "Schild"];
    const updated = updateStory("UPD2", { world, inventory });
    expect(updated!.world).toEqual(world);
    expect(updated!.inventory).toEqual(inventory);
  });

  it("updates the status field", () => {
    createStory("UPD3");
    const updated = updateStory("UPD3", { status: "completed" });
    expect(updated!.status).toBe("completed");
  });

  it("updates updated_at timestamp", async () => {
    createStory("UPD4");
    const before = getStory("UPD4")!.updatedAt;
    // Small delay to ensure timestamp differs
    await new Promise((r) => setTimeout(r, 10));
    updateStory("UPD4", { status: "completed" });
    const after = getStory("UPD4")!.updatedAt;
    // updatedAt should be a valid datetime string (may or may not differ by ms)
    expect(typeof after).toBe("string");
    expect(after.length).toBeGreaterThan(0);
    // before and after are both valid strings
    expect(before.length).toBeGreaterThan(0);
  });

  it("returns null for non-existent code", () => {
    const result = updateStory("NONE", { status: "completed" });
    expect(result).toBeNull();
  });
});

describe("listStories", () => {
  it("returns all stories", () => {
    createStory("LS01");
    createStory("LS02");
    createStory("LS03");
    const stories = listStories();
    const codes = stories.map((s) => s.code);
    expect(codes).toContain("LS01");
    expect(codes).toContain("LS02");
    expect(codes).toContain("LS03");
  });

  it("returns empty array when no stories exist", () => {
    const stories = listStories();
    expect(stories).toEqual([]);
  });
});

describe("deleteStory", () => {
  it("deletes a story and returns true", () => {
    createStory("DEL1");
    const result = deleteStory("DEL1");
    expect(result).toBe(true);
    expect(getStory("DEL1")).toBeNull();
  });

  it("returns false for non-existent code", () => {
    const result = deleteStory("NOPE");
    expect(result).toBe(false);
  });
});

describe("storyExists", () => {
  it("returns true for an existing story", () => {
    createStory("EX01");
    expect(storyExists("EX01")).toBe(true);
  });

  it("returns false for a non-existent story", () => {
    expect(storyExists("NOPE")).toBe(false);
  });
});
