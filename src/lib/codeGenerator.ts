/**
 * Generates a random 4-character code using uppercase letters + digits.
 * Excludes ambiguous chars: 0/O, 1/I/L to be iPad-friendly.
 */
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

/**
 * Validates that a string looks like a valid story code.
 */
export function isValidCode(code: string): boolean {
  return /^[A-Z0-9]{4}$/.test(code);
}
