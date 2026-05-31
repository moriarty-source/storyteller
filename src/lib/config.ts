import { getDb } from "@/lib/db";
import type { WordLimits } from "@/types/story";
import { DEFAULT_WORD_LIMITS } from "@/types/story";

export function getWordLimits(): WordLimits {
  const db = getDb();
  const row = db
    .prepare("SELECT value FROM config WHERE key = 'wordLimits'")
    .get() as { value: string } | undefined;
  if (!row) return DEFAULT_WORD_LIMITS;
  return JSON.parse(row.value) as WordLimits;
}

export function setWordLimits(limits: WordLimits): void {
  const db = getDb();
  db.prepare(
    "INSERT INTO config (key, value) VALUES ('wordLimits', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(JSON.stringify(limits));
}

export function getAdminPassword(): string {
  const db = getDb();
  const row = db
    .prepare("SELECT value FROM config WHERE key = 'adminPassword'")
    .get() as { value: string } | undefined;
  if (!row) return "admin";
  return JSON.parse(row.value) as string;
}

export function setAdminPassword(password: string): void {
  const db = getDb();
  db.prepare(
    "INSERT INTO config (key, value) VALUES ('adminPassword', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(JSON.stringify(password));
}
