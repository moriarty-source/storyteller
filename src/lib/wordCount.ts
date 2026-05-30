/**
 * Count words in a string. Splits on whitespace, ignores empty tokens.
 */
export function countWords(text: string | undefined | null): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Returns a percentage (0–100) of words used relative to the limit.
 */
export function wordPercentage(text: string, limit: number): number {
  if (limit <= 0) return 0;
  return Math.round((countWords(text) / limit) * 100);
}

/**
 * Check whether the word-limit hint should show (≥ 80%).
 */
export function shouldShowHint(text: string, limit: number): boolean {
  return wordPercentage(text, limit) >= 80;
}

/**
 * Check whether choices can be unlocked (≥ 60 words).
 */
export function canUnlockChoices(text: string): boolean {
  return countWords(text) >= 60;
}
