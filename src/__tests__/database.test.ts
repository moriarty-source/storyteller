/**
 * Database layer tests — SQLite via better-sqlite3 (through SqliteAdapter)
 */
import { getDb, ensureDb } from "@/lib/db";
import { createStory, getStory, updateStory, listStories, deleteStory, storyExists } from "@/lib/stories";
import { getWordLimits, setWordLimits, getAdminPassword } from "@/lib/config";

// Force SQLite mode for tests — unset all Postgres env vars so the
// adapter falls back to SQLite regardless of local .env contents.
delete process.env.POSTGRES_URL;
delete process.env.STORAGE_URL;
delete process.env.DATABASE_URL;
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

  test("createStory creates and returns a story", async () => {
    const story = await createStory(CODE);
    expect(story.code).toBe(CODE);
    expect(story.status).toBe("active");
    expect(story.character.name).toBe("");
    expect(story.stations).toHaveLength(6);
  });

  test("getStory returns null for unknown code", async () => {
    expect(await getStory("XXXX")).toBeNull();
  });

  test("getStory returns the created story", async () => {
    await createStory(CODE);
    const story = await getStory(CODE);
    expect(story).not.toBeNull();
    expect(story!.code).toBe(CODE);
  });

  test("storyExists returns true after creation", async () => {
    await createStory(CODE);
    expect(await storyExists(CODE)).toBe(true);
    expect(await storyExists("NOPE")).toBe(false);
  });

  test("updateStory updates status", async () => {
    await createStory(CODE);
    const updated = await updateStory(CODE, { status: "completed" });
    expect(updated!.status).toBe("completed");
  });

  test("listStories returns all stories", async () => {
    await createStory("AAA1");
    await createStory("BBB2");
    const list = await listStories();
    const codes = list.map((s) => s.code);
    expect(codes).toContain("AAA1");
    expect(codes).toContain("BBB2");
  });

  test("deleteStory removes story and returns true", async () => {
    await createStory(CODE);
    expect(await deleteStory(CODE)).toBe(true);
    expect(await getStory(CODE)).toBeNull();
  });

  test("deleteStory returns false for unknown code", async () => {
    expect(await deleteStory("NONE")).toBe(false);
  });
});

describe("config", () => {
  test("getWordLimits returns defaults", async () => {
    const limits = await getWordLimits();
    expect(limits.station1).toBe(120);
    expect(limits.consequence).toBe(60);
  });

  test("setWordLimits persists new values", async () => {
    const limits = await getWordLimits();
    await setWordLimits({ ...limits, station1: 200 });
    expect((await getWordLimits()).station1).toBe(200);
  });

  test("getAdminPassword returns default 'admin'", async () => {
    expect(await getAdminPassword()).toBe("admin");
  });
});
