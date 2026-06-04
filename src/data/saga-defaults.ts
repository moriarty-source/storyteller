// src/data/saga-defaults.ts
// Default seed data for Storyteller Saga.

import type { SagaVariableDefinition, SagaTextBlock } from "@/types/saga";

const now = new Date().toISOString();

export const DEFAULT_SAGA_VARIABLES: SagaVariableDefinition[] = [
  // Character sheet variables (free-text)
  { key: "char_name", label: "Name", prompt: "", options: [], setInStation: 0, isMainChoice: false, updatedAt: now },
  { key: "char_archetype", label: "Archetype", prompt: "Who is your character?", options: [
    { value: "die Abenteurerin", emoji: "🦊" },
    { value: "der Suchende", emoji: "🔍" },
    { value: "die Rebellin", emoji: "⚡" },
    { value: "der Hüter", emoji: "🛡️" },
  ], setInStation: 0, isMainChoice: false, updatedAt: now },
  { key: "char_origin", label: "Origin", prompt: "Where is your character from?", options: [
    { value: "aus der staubigen Hafenstadt", emoji: "⚓" },
    { value: "vom Rand des Nebelwalds", emoji: "🌲" },
    { value: "vom Berg der Stille", emoji: "⛰️" },
    { value: "vom Schiff der Schaumkrönchen", emoji: "🌊" },
    { value: "von den wandernden Wegen", emoji: "🛤️" },
  ], setInStation: 0, isMainChoice: false, updatedAt: now },
  { key: "char_trait", label: "Trait", prompt: "", options: [], setInStation: 0, isMainChoice: false, updatedAt: now },
  { key: "char_weakness", label: "Weakness", prompt: "", options: [], setInStation: 0, isMainChoice: false, updatedAt: now },
  { key: "char_goal", label: "Goal", prompt: "", options: [], setInStation: 0, isMainChoice: false, updatedAt: now },
  { key: "char_secret", label: "Secret", prompt: "", options: [], setInStation: 0, isMainChoice: false, updatedAt: now },
  { key: "char_bond", label: "Bond", prompt: "", options: [], setInStation: 0, isMainChoice: false, updatedAt: now },
  { key: "world_setting", label: "Setting", prompt: "How does the world feel?", options: [
    { value: "Dunkel & geheimnisvoll", emoji: "🌑" },
    { value: "Hell & hoffnungsvoll", emoji: "☀️" },
    { value: "Magisch & funkelnd", emoji: "✨" },
  ], setInStation: 0, isMainChoice: false, updatedAt: now },
  { key: "world_location", label: "Location", prompt: "", options: [], setInStation: 0, isMainChoice: false, updatedAt: now },
  // Station 1 – Companion
  { key: "companion", label: "Companion", prompt: "Who accompanies you?", options: [
    { value: "der schlaue Fuchs", emoji: "🦊" },
    { value: "die kluge Krähe", emoji: "🦅" },
    { value: "der kleine Roboter Piep", emoji: "🤖" },
  ], setInStation: 1, isMainChoice: false, updatedAt: now },
  { key: "char_emotion", label: "Emotion", prompt: "How do you feel?", options: [
    { value: "ein kaltes Kribbeln im Bauch", emoji: "🌊" },
    { value: "Feuer in deiner Brust", emoji: "🔥" },
    { value: "Ruhig wie ein tiefer See", emoji: "🍃" },
  ], setInStation: 2, isMainChoice: false, updatedAt: now },
  { key: "map_name", label: "Map", prompt: "What do you find?", options: [
    { value: "eine verblasste Lederkarte", emoji: "🗺️" },
    { value: "die Karte aus dem Traum", emoji: "💭" },
    { value: "nichts dabei", emoji: "🚫" },
  ], setInStation: 1, isMainChoice: false, updatedAt: now },
  // Station 3 – Mentor
  { key: "amulett_name", label: "Amulet", prompt: "What does the mentor give?", options: [
    { value: "das schimmernde Mondamulett", emoji: "🌙" },
    { value: "der Splitter der Sterne", emoji: "⭐" },
    { value: "die wärmende Feder", emoji: "🪶" },
  ], setInStation: 3, isMainChoice: false, updatedAt: now },
  { key: "lamp_name", label: "Lamp", prompt: "What light do you find?", options: [
    { value: "die alte Laterne", emoji: "🏮" },
    { value: "der leuchtende Splitter", emoji: "💎" },
    { value: "nichts dabei", emoji: "🚫" },
  ], setInStation: 3, isMainChoice: false, updatedAt: now },
  { key: "mentor_trust", label: "Trust", prompt: "How does the mentor react?", options: [
    { value: "vertraut dir blind", emoji: "🤝" },
    { value: "ist vorsichtig", emoji: "🤔" },
    { value: "zweifelt an dir", emoji: "😒" },
  ], setInStation: 3, isMainChoice: true, updatedAt: now },
  // Station 4 – Test
  { key: "riddle_solved", label: "Riddle", prompt: "Can you solve it?", options: [
    { value: "das Rätsel ist gelöst", emoji: "🔓" },
    { value: "du stehst hilflos davor", emoji: "🧩" },
  ], setInStation: 4, isMainChoice: true, updatedAt: now },
  // Station 5 – Climax
  { key: "confrontation_style", label: "Approach", prompt: "How do you confront?", options: [
    { value: "direkt und mutig", emoji: "⚔️" },
    { value: "listig und vorsichtig", emoji: "🦊" },
    { value: "mitfühlend und klug", emoji: "💡" },
  ], setInStation: 5, isMainChoice: true, updatedAt: now },
];

export const DEFAULT_SAGA_TEXT_BLOCKS: SagaTextBlock[] = [
  { id: 1, category: "intro", template: "{char_name}, {char_archetype} {char_origin}, spürte {char_emotion}. Heute begann alles.", conditions: [], updatedAt: now },
  { id: 2, category: "scene", template: "An deiner Seite war {companion}. Gemeinsam entdecktet ihr {map_name}.", conditions: [], updatedAt: now },
  { id: 3, category: "scene", template: "Die Welt um dich herum fühlte sich {world_setting} an, in {world_location}.", conditions: [], updatedAt: now },
  { id: 4, category: "scene", template: "Du zögertest. {char_emotion} hielt dich zurück.", conditions: [], updatedAt: now },
  { id: 5, category: "consequence", template: "Du gingst los, obwohl {char_emotion} in dir war.", conditions: [], updatedAt: now },
  { id: 6, category: "scene", template: "Der Mentor schenkte dir {amulett_name} und {lamp_name}.", conditions: [], updatedAt: now },
  { id: 7, category: "consequence", template: "{mentor_trust}. Du fühltest dich bereit.", conditions: [], updatedAt: now },
  { id: 8, category: "scene", template: "Die Prüfung wartete. Am Ende: {riddle_solved}.", conditions: [], updatedAt: now },
  { id: 9, category: "consequence", template: "Im Höhepunkt tratst du {confrontation_style} auf. {companion} stand dir bei.", conditions: [], updatedAt: now },
  { id: 10, category: "summary", template: "Am Ende warst du nicht mehr dieselbe Person. {char_name}, {char_archetype} {char_origin}, kehrte heim — anders als zuvor.", conditions: [], updatedAt: now },
];
