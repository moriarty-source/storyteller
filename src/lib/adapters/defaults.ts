export const DEFAULT_CHARACTER = {
  name: "",
  strength: "Mutig",
  weakness: "",
  goal: "",
} as const;

export const DEFAULT_WORLD = {
  description: "",
  problem: "",
} as const;

import { STATIONS } from "@/types/story";

export const DEFAULT_STATIONS = STATIONS.map((s) => ({
  id: s.id,
  text: "",
  choices: [],
  completed: false,
}));
