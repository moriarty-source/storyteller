import { sql } from "@vercel/postgres";
import type { WordLimits } from "@/types/story";
import { DEFAULT_WORD_LIMITS } from "@/types/story";

export async function getWordLimits(): Promise<WordLimits> {
  const result = await sql`
    SELECT value FROM config WHERE key = 'word_limits'
  `;
  
  if (result.rows.length === 0) {
    return DEFAULT_WORD_LIMITS;
  }
  
  return JSON.parse((result.rows[0] as any).value);
}

export async function setWordLimits(limits: WordLimits): Promise<void> {
  await sql`
    INSERT INTO config (key, value) 
    VALUES ('word_limits', ${JSON.stringify(limits)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

export async function getAdminPassword(): Promise<string> {
  const result = await sql`
    SELECT value FROM config WHERE key = 'admin_password'
  `;
  
  if (result.rows.length === 0) {
    return "workshop2024";
  }
  
  return JSON.parse((result.rows[0] as any).value);
}

export async function setAdminPassword(password: string): Promise<void> {
  await sql`
    INSERT INTO config (key, value) 
    VALUES ('admin_password', ${JSON.stringify(password)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}