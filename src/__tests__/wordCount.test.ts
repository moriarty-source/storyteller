import { countWords, wordPercentage, shouldShowHint, canUnlockChoices } from "@/lib/wordCount";

describe("countWords", () => {
  it("returns 0 for empty string", () => {
    expect(countWords("")).toBe(0);
  });

  it("returns 0 for whitespace-only", () => {
    expect(countWords("   \n\t  ")).toBe(0);
  });

  it("counts single word", () => {
    expect(countWords("Hallo")).toBe(1);
  });

  it("counts multiple words", () => {
    expect(countWords("Lena stand vor der Brücke")).toBe(5);
  });

  it("handles extra whitespace between words", () => {
    expect(countWords("  Lena   stand   vor  ")).toBe(3);
  });
});

describe("wordPercentage", () => {
  it("returns 0 for empty text", () => {
    expect(wordPercentage("", 120)).toBe(0);
  });

  it("calculates correct percentage", () => {
    const text = Array(60).fill("wort").join(" "); // 60 words
    expect(wordPercentage(text, 120)).toBe(50);
  });

  it("returns 0 for zero limit", () => {
    expect(wordPercentage("hallo welt", 0)).toBe(0);
  });
});

describe("shouldShowHint", () => {
  it("returns false under 80%", () => {
    const text = Array(79).fill("wort").join(" ");
    expect(shouldShowHint(text, 100)).toBe(false);
  });

  it("returns true at 80%", () => {
    const text = Array(80).fill("wort").join(" ");
    expect(shouldShowHint(text, 100)).toBe(true);
  });

  it("returns true over 80%", () => {
    const text = Array(95).fill("wort").join(" ");
    expect(shouldShowHint(text, 100)).toBe(true);
  });
});

describe("canUnlockChoices", () => {
  it("returns false under 60 words", () => {
    const text = Array(59).fill("wort").join(" ");
    expect(canUnlockChoices(text)).toBe(false);
  });

  it("returns true at 60 words", () => {
    const text = Array(60).fill("wort").join(" ");
    expect(canUnlockChoices(text)).toBe(true);
  });
});
