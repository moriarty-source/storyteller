import { compileToInk } from "@/lib/inkCompiler";
import type { Story, Station, Character, World } from "@/types/story";

// ── helpers ─────────────────────────────────────────────────────────────────

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    name: "Lena",
    strength: "Mutig",
    weakness: "Ungeduld",
    goal: "Den Wald retten",
    ...overrides,
  };
}

function makeWorld(overrides: Partial<World> = {}): World {
  return {
    description: "Ein verwunschener Wald",
    problem: "Der Wald stirbt",
    ...overrides,
  };
}

function makeStation(id: number, overrides: Partial<Station> = {}): Station {
  return {
    id,
    text: `Station ${id} Text`,
    choices: [
      { label: "Wahl A", consequence: "Konsequenz A" },
      { label: "Wahl B", consequence: "Konsequenz B" },
    ],
    completed: false,
    ...overrides,
  };
}

function makeStory(overrides: Partial<Story> = {}): Story {
  return {
    code: "K7M2",
    status: "active",
    character: makeCharacter(),
    world: makeWorld(),
    inventory: [],
    stations: [makeStation(1)],
    createdAt: "2026-05-30T10:00:00Z",
    updatedAt: "2026-05-30T10:00:00Z",
    ...overrides,
  };
}

// ── tests ────────────────────────────────────────────────────────────────────

describe("compileToInk", () => {
  // 1. Minimal story: intro + station_1 + choices + -> END
  it("produces intro knot and station_1 for a minimal one-station story", () => {
    const story = makeStory();
    const ink = compileToInk(story);

    expect(ink).toContain("=== intro ===");
    expect(ink).toContain("=== station_1 ===");
    expect(ink).toContain("-> END");
  });

  it("includes choice labels and consequence text in station output", () => {
    const story = makeStory();
    const ink = compileToInk(story);

    expect(ink).toContain("* [Wahl A]");
    expect(ink).toContain("Konsequenz A");
    expect(ink).toContain("* [Wahl B]");
    expect(ink).toContain("Konsequenz B");
  });

  it("adds a gather line after choices", () => {
    const story = makeStory();
    const ink = compileToInk(story);

    // The gather marker '-' must appear after choices
    expect(ink).toMatch(/\*\s*\[.*?\][\s\S]*^-\s/m);
  });

  // 2. Multi-station chaining
  it("chains multiple stations: station_1 -> station_2 -> ... -> END", () => {
    const story = makeStory({
      stations: [makeStation(1), makeStation(2), makeStation(3)],
    });
    const ink = compileToInk(story);

    expect(ink).toContain("=== station_1 ===");
    expect(ink).toContain("=== station_2 ===");
    expect(ink).toContain("=== station_3 ===");
    // station_1 diverts to station_2
    expect(ink).toContain("-> station_2");
    // station_2 diverts to station_3
    expect(ink).toContain("-> station_3");
    // last station diverts to END
    expect(ink).toContain("-> END");
    // station_3 must NOT divert to a non-existent station_4
    expect(ink).not.toContain("-> station_4");
  });

  it("intro diverts to station_1", () => {
    const story = makeStory();
    const ink = compileToInk(story);

    // After the intro knot there should be a divert to station_1
    expect(ink).toContain("-> station_1");
  });

  // 3. Character variables as VAR declarations
  it("declares character fields as Ink VAR in the intro", () => {
    const character: Character = {
      name: "Felix",
      strength: "Schlau",
      weakness: "Schüchternheit",
      goal: "Freunde finden",
      secret: "Kann fliegen",
    };
    const story = makeStory({ character });
    const ink = compileToInk(story);

    expect(ink).toContain('VAR character_name = "Felix"');
    expect(ink).toContain('VAR character_strength = "Schlau"');
    expect(ink).toContain('VAR character_weakness = "Schüchternheit"');
    expect(ink).toContain('VAR character_goal = "Freunde finden"');
    expect(ink).toContain('VAR character_secret = "Kann fliegen"');
  });

  it("declares character secret as empty string when absent", () => {
    const story = makeStory({ character: makeCharacter({ secret: undefined }) });
    const ink = compileToInk(story);

    expect(ink).toContain('VAR character_secret = ""');
  });

  // 4. Inventory items as VAR declarations
  it("declares inventory items as VAR has_<item> = false", () => {
    const story = makeStory({ inventory: ["Schwert", "Schild", "Trank"] });
    const ink = compileToInk(story);

    expect(ink).toContain("VAR has_Schwert = false");
    expect(ink).toContain("VAR has_Schild = false");
    expect(ink).toContain("VAR has_Trank = false");
  });

  it("produces no inventory VAR declarations for an empty inventory", () => {
    const story = makeStory({ inventory: [] });
    const ink = compileToInk(story);

    expect(ink).not.toContain("VAR has_");
  });

  // 5. Empty stations handled gracefully
  it("skips choice block for a station with empty text", () => {
    const emptyStation: Station = {
      id: 1,
      text: "",
      choices: [],
      completed: false,
    };
    const story = makeStory({ stations: [emptyStation] });
    // Should not throw
    const ink = compileToInk(story);
    expect(typeof ink).toBe("string");
    // Still needs to terminate
    expect(ink).toContain("-> END");
  });

  it("handles a station with no choices gracefully", () => {
    const noChoiceStation: Station = {
      id: 1,
      text: "Es war einmal...",
      choices: [],
      completed: false,
    };
    const story = makeStory({ stations: [noChoiceStation] });
    const ink = compileToInk(story);

    expect(ink).toContain("=== station_1 ===");
    expect(ink).toContain("Es war einmal...");
    expect(ink).toContain("-> END");
  });

  // 6. Station with text but no choices still produces output and diverts forward
  it("station with text but no choices produces text output and chains forward", () => {
    const textOnly: Station = {
      id: 1,
      text: "Nur Text, keine Wahl",
      choices: [],
      completed: false,
    };
    const nextStation = makeStation(2);
    const story = makeStory({ stations: [textOnly, nextStation] });
    const ink = compileToInk(story);

    expect(ink).toContain("Nur Text, keine Wahl");
    expect(ink).toContain("-> station_2");
  });

  // Edge: station text appears in knot body
  it("includes station text in the station knot body", () => {
    const station = makeStation(1, { text: "Die Heldin betritt den Wald." });
    const story = makeStory({ stations: [station] });
    const ink = compileToInk(story);

    expect(ink).toContain("Die Heldin betritt den Wald.");
  });

  // Overall structure: intro must come before station knots
  it("places intro before station knots", () => {
    const story = makeStory();
    const ink = compileToInk(story);

    const introIdx = ink.indexOf("=== intro ===");
    const stationIdx = ink.indexOf("=== station_1 ===");
    expect(introIdx).toBeLessThan(stationIdx);
  });

  // VAR declarations should be at the top (before intro knot)
  it("places VAR declarations before the intro knot", () => {
    const story = makeStory({ inventory: ["Karte"] });
    const ink = compileToInk(story);

    const varIdx = ink.indexOf("VAR");
    const introIdx = ink.indexOf("=== intro ===");
    expect(varIdx).toBeLessThan(introIdx);
  });
});
