// Vercel PostgreSQL Database Connection
// Uses @vercel/postgres for serverless-compatible database access
// 
// Usage: Call ensureDb() at the start of each API route that needs DB access

import { sql } from "@vercel/postgres";

export { sql };

let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

/**
 * Initialize database tables and seed default config.
 * Safe to call multiple times - uses promise deduplication.
 */
export async function initDatabase(): Promise<void> {
  if (dbInitialized) return;
  
  // Prevent concurrent initialization attempts
  if (dbInitPromise) {
    return dbInitPromise;
  }
  
  dbInitPromise = (async () => {
    try {
      // Test connection first
      await sql`SELECT 1`;
      console.log('✓ Database connection successful');
      
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
      console.log('✓ Stories table ready');

      // Create config table if not exists
      await sql`
        CREATE TABLE IF NOT EXISTS config (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL
        )
      `;
      console.log('✓ Config table ready');

      // Seed default config if not present
      const existingConfig = await sql`SELECT key FROM config WHERE key = 'word_limits'`;
      
      if (existingConfig.rows.length === 0) {
        const { DEFAULT_WORD_LIMITS } = await import("@/types/story");
        await sql`
          INSERT INTO config (key, value) 
          VALUES ('word_limits', ${JSON.stringify(DEFAULT_WORD_LIMITS)}::jsonb)
        `;
        console.log('✓ Default word limits seeded');
      }

      const existingPw = await sql`SELECT key FROM config WHERE key = 'admin_password'`;
      
      if (existingPw.rows.length === 0) {
        await sql`
          INSERT INTO config (key, value) 
          VALUES ('admin_password', ${JSON.stringify("workshop2024")}::jsonb)
        `;
        console.log('✓ Admin password seeded');
      }
      
      dbInitialized = true;
      console.log('✅ Database fully initialized');
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      dbInitPromise = null; // Reset to allow retry
      throw error;
    }
  })();
  
  return dbInitPromise;
}

/**
 * Ensure database is initialized before use.
 * Call this at the start of each API route.
 */
export async function ensureDb(): Promise<void> {
  if (!dbInitialized) {
    await initDatabase();
  }
}

export async function closeDb(): Promise<void> {
  // No-op for Vercel Postgres (connection pooling managed automatically)
}