// Vercel PostgreSQL Database Connection
// Uses @vercel/postgres for serverless-compatible database access

import { sql } from "@vercel/postgres";

export { sql };

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

export async function closeDb(): Promise<void> {
  // No-op for Vercel Postgres (connection pooling is managed automatically)
}