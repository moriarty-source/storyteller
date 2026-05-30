// ── Choice ──────────────────────────────────────────
export interface Choice {
  label: string;
  consequence: string;
}

// ── Station ─────────────────────────────────────────
export interface Station {
  id: number; // 1–6
  text: string;
  choices: Choice[];
  completed: boolean;
}

// ── Character ───────────────────────────────────────
export type Strength = "Mutig" | "Schlau" | "Einfühlsam" | "Stark";

export interface Character {
  name: string;
  strength: Strength;
  weakness: string;
  goal: string;
  secret?: string;
}

// ── World ───────────────────────────────────────────
export interface World {
  description: string;
  problem: string;
}

// ── Story ───────────────────────────────────────────
export type StoryStatus = "active" | "completed";

export interface Story {
  code: string; // 4-char, e.g. "K7M2"
  status: StoryStatus;
  character: Character;
  world: World;
  inventory: string[];
  stations: Station[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ── Word Limits (admin-configurable) ────────────────
export interface WordLimits {
  station1: number;
  station2: number;
  station3: number;
  station4: number;
  station5: number;
  station6: number;
  consequence: number;
}

export const DEFAULT_WORD_LIMITS: WordLimits = {
  station1: 120,
  station2: 150,
  station3: 150,
  station4: 200,
  station5: 240,
  station6: 150,
  consequence: 60,
};

// ── Config ──────────────────────────────────────────
export interface Config {
  wordLimits: WordLimits;
  adminPassword: string;
}

// ── Station metadata (UI helpers) ───────────────────
export interface StationMeta {
  id: number;
  title: string;
  hint: string;
  expandedHint: string;
  minChoices: number;
  maxChoices: number;
}

export const STATIONS: StationMeta[] = [
  {
    id: 1,
    title: "Ruf zum Abenteuer",
    hint: "Was bricht die Routine deines Charakters?",
    expandedHint:
      "Etwas Unerwartetes passiert — eine Nachricht, eine Entdeckung, ein Fremder. Dein Charakter spürt: Etwas muss sich ändern.",
    minChoices: 2,
    maxChoices: 2,
  },
  {
    id: 2,
    title: "Weigerung / Zögern",
    hint: "Warum zögert dein Charakter?",
    expandedHint:
      "Die Aufgabe scheint zu groß, zu gefährlich, oder dein Charakter hat Angst. Was hält ihn/sie zurück?",
    minChoices: 2,
    maxChoices: 2,
  },
  {
    id: 3,
    title: "Mentor / Hilfe",
    hint: "Wer oder was gibt deinem Charakter Mut?",
    expandedHint:
      "Ein weiser Helfer, ein Zeichen, ein Gegenstand — irgendetwas gibt deinem Charakter die Kraft weiterzumachen.",
    minChoices: 2,
    maxChoices: 2,
  },
  {
    id: 4,
    title: "Erste Prüfung",
    hint: "Was stellt sich deinem Charakter in den Weg?",
    expandedHint:
      "Ein Hindernis, ein Rätsel, ein Gegner. Dein Charakter muss zeigen, was in ihm/ihr steckt.",
    minChoices: 2,
    maxChoices: 3,
  },
  {
    id: 5,
    title: "Höhepunkt",
    hint: "Der größte Moment! Was passiert?",
    expandedHint:
      "Alles spitzt sich zu. Dein Charakter steht vor der größten Herausforderung. Hier entscheidet sich alles.",
    minChoices: 2,
    maxChoices: 2,
  },
  {
    id: 6,
    title: "Rückkehr",
    hint: "Wie kehrt dein Charakter verändert zurück?",
    expandedHint:
      "Das Abenteuer ist vorbei. Dein Charakter kehrt heim — aber er/sie ist nicht mehr dieselbe Person wie vorher.",
    minChoices: 0,
    maxChoices: 0,
  },
];
