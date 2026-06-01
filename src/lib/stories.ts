/**
 * Story CRUD — thin async wrappers over the active DbAdapter.
 * The adapter is selected automatically:
 *   POSTGRES_URL set  → Neon/Postgres
 *   POSTGRES_URL unset → SQLite (Pi, local)
 */

import { getAdapter } from "@/lib/db-adapter";
import type { Story } from "@/types/story";

export async function createStory(code: string): Promise<Story> {
  return getAdapter().createStory(code);
}

export async function getStory(code: string): Promise<Story | null> {
  return getAdapter().getStory(code);
}

export async function updateStory(
  code: string,
  updates: Partial<
    Pick<Story, "character" | "world" | "inventory" | "stations" | "status">
  >
): Promise<Story | null> {
  return getAdapter().updateStory(code, updates);
}

export async function listStories(): Promise<Story[]> {
  return getAdapter().listStories();
}

export async function deleteStory(code: string): Promise<boolean> {
  return getAdapter().deleteStory(code);
}

export async function storyExists(code: string): Promise<boolean> {
  return getAdapter().storyExists(code);
}
