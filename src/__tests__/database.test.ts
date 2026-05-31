/**
 * Database layer tests — SQLite via better-sqlite3
 */
import { getDb, ensureDb } from "@/lib/db";
import { createStory, getStory, updateStory, listStories, deleteStory, storyExists } from "@/lib/stories";
import { getWordLimits, setWordLimits, getAdminPassword } from "@/lib/config";

// Use an in-memory DB for tests
process.env.DB_PATH = ":memory:";

// Clear and re-seed between tests to avoid state pollution
beforeEach(() => {
  const db = getDb();
  db.prepare("DELETE FROM stories").run();
  db.prepare("DELETE FROM config").run();
  db.prepare("INSERT INTO config (key, value) VALUES ('wordLimits', ?)").run(
    JSON.stringify({ station1: 120, station2: 150, station3: 150, station4: 200, station5: 240, station6: 150, consequence: 60 })
  );
  db.prepare("INSERT INTO config (key, value) VALUES ('adminPassword', ?)").run(JSON.stringify("admin"));
});

describe("Database Layer (SQLite)", () => {

  test("ensureDb() is callable without errors", () => {
    expect(() => ensureDb()).not.toThrow();
  });

  test("getDb() returns a Database instance", () => {
    const db = getDb();
    expect(db).toBeDefined();
    expect(typeof db.prepare).toBe("function");
  });
});

describe("stories CRUD", () => {
  const CODE = "TEST";

  test("createStory creates and returns a story", () => {
    const story = createStory(CODE);
    expect(story.code).toBe(CODE);
    expect(story.status).toBe("active");
    expect(story.character.name).toBe("");
    expect(story.stations).toHaveLength(6);
  });

  test("getStory returns null for unknown code", () => {
    expect(getStory("XXXX")).toBeNull();
  });

  test("getStory returns the created story", () => {
    createStory(CODE);
    const story = getStory(CODE);
    expect(story).not.toBeNull();
    expect(story!.code).toBe(CODE);
  });

  test("storyExists returns true after creation", () => {
    createStory(CODE);
    expect(storyExists(CODE)).toBe(true);
    expect(storyExists("NOPE")).toBe(false);
  });

  test("updateStory updates status", () => {
    createStory(CODE);
    const updated = updateStory(CODE, { status: "completed" });
    expect(updated!.status).toBe("completed");
  });

  test("listStories returns all stories", () => {
    createStory("AAA1");
    createStory("BBB2");
    const list = listStories();
    const codes = list.map((s) => s.code);
    expect(codes).toContain("AAA1");
    expect(codes).toContain("BBB2");
  });

  test("deleteStory removes story and returns true", () => {
    createStory(CODE);
    expect(deleteStory(CODE)).toBe(true);
    expect(getStory(CODE)).toBeNull();
  });

  test("deleteStory returns false for unknown code", () => {
    expect(deleteStory("NONE")).toBe(false);
  });
});

describe("config", () => {
  test("getWordLimits returns defaults", () => {
    const limits = getWordLimits();
    expect(limits.station1).toBe(120);
    expect(limits.consequence).toBe(60);
  });

  test("setWordLimits persists new values", () => {
    const limits = getWordLimits();
    setWordLimits({ ...limits, station1: 200 });
    expect(getWordLimits().station1).toBe(200);
  });

  test("getAdminPassword returns default 'admin'", () => {
    expect(getAdminPassword()).toBe("admin");
  });
});
