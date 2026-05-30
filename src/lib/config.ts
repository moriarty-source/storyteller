import { WordLimits, DEFAULT_WORD_LIMITS } from "@/types/story";
import { getDb } from "@/lib/db";

const WORD_LIMITS_KEY = "wordLimits";
const ADMIN_PASSWORD_KEY = "adminPassword";

export function getWordLimits(): WordLimits {
  const db = getDb();
  const row = db
    .prepare("SELECT value FROM config WHERE key = ?")
    .get(WORD_LIMITS_KEY) as { value: string } | undefined;
  if (!row) return { ...DEFAULT_WORD_LIMITS };
  return JSON.parse(row.value) as WordLimits;
}

export function setWordLimits(limits: WordLimits): void {
  const db = getDb();
  db.prepare(
    "INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)"
  ).run(WORD_LIMITS_KEY, JSON.stringify(limits));
}

export function getAdminPassword(): string {
  const db = getDb();
  const row = db
    .prepare("SELECT value FROM config WHERE key = ?")
    .get(ADMIN_PASSWORD_KEY) as { value: string } | undefined;
  if (!row) return "admin";
  return row.value;
}

export function setAdminPassword(password: string): void {
  const db = getDb();
  db.prepare(
    "INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)"
  ).run(ADMIN_PASSWORD_KEY, password);
}
