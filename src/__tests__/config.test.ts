/**
 * Tests for src/lib/config.ts
 * Uses an in-memory SQLite database to avoid touching the filesystem.
 */
import Database from "better-sqlite3";
import { DEFAULT_WORD_LIMITS } from "@/types/story";

let testDb: Database.Database;

jest.mock("@/lib/db", () => ({
  getDb: () => testDb,
}));

import {
  getWordLimits,
  setWordLimits,
  getAdminPassword,
  setAdminPassword,
} from "@/lib/config";

function initTestDb(): Database.Database {
  const db = new Database(":memory:");
  db.exec(`
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

describe("getWordLimits", () => {
  it("returns defaults when nothing is saved", () => {
    const limits = getWordLimits();
    expect(limits).toEqual(DEFAULT_WORD_LIMITS);
  });
});

describe("setWordLimits / getWordLimits roundtrip", () => {
  it("saves and retrieves custom word limits", () => {
    const custom = {
      station1: 100,
      station2: 110,
      station3: 120,
      station4: 130,
      station5: 140,
      station6: 150,
      consequence: 50,
    };
    setWordLimits(custom);
    const retrieved = getWordLimits();
    expect(retrieved).toEqual(custom);
  });

  it("overwrites previously saved limits", () => {
    setWordLimits({ ...DEFAULT_WORD_LIMITS, station1: 99 });
    setWordLimits({ ...DEFAULT_WORD_LIMITS, station1: 77 });
    const limits = getWordLimits();
    expect(limits.station1).toBe(77);
  });
});

describe("getAdminPassword", () => {
  it("returns 'admin' as default when nothing is saved", () => {
    expect(getAdminPassword()).toBe("admin");
  });
});

describe("setAdminPassword / getAdminPassword roundtrip", () => {
  it("saves and retrieves a custom password", () => {
    setAdminPassword("s3cr3t!");
    expect(getAdminPassword()).toBe("s3cr3t!");
  });

  it("overwrites previously saved password", () => {
    setAdminPassword("first");
    setAdminPassword("second");
    expect(getAdminPassword()).toBe("second");
  });
});
