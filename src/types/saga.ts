// src/types/saga.ts
// All Storyteller Saga types. Single import surface for the rest of the codebase.

export type SagaMode = "saga";

export type SagaArchetype = "Abenteurer" | "Suchender" | "Rebell" | "Hüter";

export type SagaOrigin = "Stadt" | "Wald" | "Berg" | "Küste" | "Nomade";

export type SagaSetting =
  | "Dunkel & geheimnisvoll"
  | "Hell & hoffnungsvoll"
  | "Magisch & funkelnd";

export interface SagaCharacter {
  name: string;
  archetype: SagaArchetype | "";
  trait: string;
  weakness: string;
  goal: string;
  secret: string;
  origin: SagaOrigin | "";
  bond: string;
}

export interface SagaWorld {
  setting: SagaSetting | "";
  location: string;
  problem: string;
  hint: string;
}

export interface SagaMainChoice {
  id: number;
  label: string;
  consequenceBlockId: number;
}

export interface SagaMicroOption {
  id: number;
  label: string;
  emoji: string;
  blockId: number;
  setsVariable?: { key: string; value: string | number | boolean };
}

export interface SagaMicroChoice {
  id: number;
  prompt: string;
  options: SagaMicroOption[];
}

export interface SagaStation {
  id: number;
  blockSelections: number[];
  mainChoiceIndex: number | null;
  completed: boolean;
}

export interface VariableSnapshotEntry {
  key: string;
  label: string;
  prompt: string;
  setInStation: number;
  isMainChoice: boolean;
  options: VariableOption[];
}

export interface SagaStory {
  code: string;
  mode: "saga";
  status: "active" | "completed";
  character: SagaCharacter;
  world: SagaWorld;
  inventory: string[];
  stations: SagaStation[];
  variables: Record<string, string | number | boolean>;
  variableSnapshot: VariableSnapshotEntry[];
  createdAt: string;
  updatedAt: string;
}

export type SagaTextBlockCategory =
  | "intro"
  | "scene"
  | "reaction"
  | "consequence"
  | "transition"
  | "summary";

export interface BlockCondition {
  key: string;
  equals: string | number | boolean;
}

export interface SagaTextBlock {
  id: number;
  category: SagaTextBlockCategory;
  template: string;
  conditions: BlockCondition[];
  updatedAt: string;
}

export interface VariableOption {
  value: string;
  emoji: string;
}

export interface SagaVariableDefinition {
  key: string;
  label: string;
  prompt: string;
  options: VariableOption[];
  setInStation: number;
  isMainChoice: boolean;
  updatedAt: string;
}

export const DEFAULT_SAGA_CHARACTER: SagaCharacter = {
  name: "",
  archetype: "",
  trait: "",
  weakness: "",
  goal: "",
  secret: "",
  origin: "",
  bond: "",
};

export const DEFAULT_SAGA_WORLD: SagaWorld = {
  setting: "",
  location: "",
  problem: "",
  hint: "",
};

export const DEFAULT_SAGA_STATIONS: SagaStation[] = [
  { id: 1, blockSelections: [], mainChoiceIndex: null, completed: false },
  { id: 2, blockSelections: [], mainChoiceIndex: null, completed: false },
  { id: 3, blockSelections: [], mainChoiceIndex: null, completed: false },
  { id: 4, blockSelections: [], mainChoiceIndex: null, completed: false },
  { id: 5, blockSelections: [], mainChoiceIndex: null, completed: false },
  { id: 6, blockSelections: [], mainChoiceIndex: null, completed: false },
];

// UI constants for selections
export const SAGA_ARCHETYPES: SagaArchetype[] = ["Abenteurer", "Suchender", "Rebell", "Hüter"];
export const SAGA_ORIGINS: SagaOrigin[] = ["Stadt", "Wald", "Berg", "Küste", "Nomade"];
export const SAGA_SETTINGS: SagaSetting[] = [
  "Dunkel & geheimnisvoll",
  "Hell & hoffnungsvoll",
  "Magisch & funkelnd",
];
