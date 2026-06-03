/**
 * Config CRUD — thin async wrappers over the active DbAdapter.
 */

import { getAdapter } from "@/lib/db-adapter";
import type { WordLimits } from "@/types/story";

export async function getWordLimits(): Promise<WordLimits> {
  return (await getAdapter()).getWordLimits();
}

export async function setWordLimits(limits: WordLimits): Promise<void> {
  return (await getAdapter()).setWordLimits(limits);
}

export async function getAdminPassword(): Promise<string> {
  return (await getAdapter()).getAdminPassword();
}

export async function setAdminPassword(password: string): Promise<void> {
  return (await getAdapter()).setAdminPassword(password);
}
