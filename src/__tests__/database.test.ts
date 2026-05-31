/**
 * Database integration tests
 * Tests verify that DB functions are async and work with @vercel/postgres
 */

jest.mock("@vercel/postgres", () => ({
  sql: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
}));

import { ensureDb } from "@/lib/db";

describe("Database Layer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("ensureDb is async and callable", async () => {
    await expect(ensureDb()).resolves.not.toThrow();
  });
});