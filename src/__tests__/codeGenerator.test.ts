import { generateCode, isValidCode } from "@/lib/codeGenerator";

describe("generateCode", () => {
  it("returns a 4-character string", () => {
    const code = generateCode();
    expect(code).toHaveLength(4);
  });

  it("uses only uppercase letters and digits", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateCode();
      expect(code).toMatch(/^[A-Z0-9]{4}$/);
    }
  });

  it("does not contain ambiguous characters (0, O, 1, I, L)", () => {
    for (let i = 0; i < 100; i++) {
      const code = generateCode();
      expect(code).not.toMatch(/[0OIL1]/);
    }
  });

  it("generates different codes", () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("isValidCode", () => {
  it("accepts valid 4-char codes", () => {
    expect(isValidCode("K7M2")).toBe(true);
    expect(isValidCode("ABCD")).toBe(true);
    expect(isValidCode("1234")).toBe(true);
  });

  it("rejects too short", () => {
    expect(isValidCode("AB")).toBe(false);
  });

  it("rejects too long", () => {
    expect(isValidCode("ABCDE")).toBe(false);
  });

  it("rejects lowercase", () => {
    expect(isValidCode("abcd")).toBe(false);
  });

  it("rejects special characters", () => {
    expect(isValidCode("AB-C")).toBe(false);
  });
});
