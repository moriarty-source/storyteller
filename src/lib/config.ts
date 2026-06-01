/**
 * Config CRUD — thin async wrappers over the active DbAdapter.
 */

import { getAdapter } from "@/lib/db-adapter";
import type { WordLimits } from "@/types/story";

export async function getWordLimits(): Promise<WordLimits> {
  return getAdapter().getWordLimits();
}

export async function setWordLimits(limits: WordLimits): Promise<void> {
  return getAdapter().setWordLimits(limits);
}

export async function getAdminPassword(): Promise<string> {
  return getAdapter().getAdminPassword();
}

export async function setAdminPassword(password: string): Promise<void> {
  return getAdapter().setAdminPassword(password);
}
