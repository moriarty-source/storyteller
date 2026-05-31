import type { Story, Station } from "@/types/story";

/**
 * Converts a Story object into valid Ink markup for playable via inkjs.
 *
 * Structure:
 *   [VAR declarations]
 *   === intro ===
 *   [intro text using character/world info]
 *   -> station_1
 *
 *   === station_N ===
 *   [station text]
 *   * [choice label]
 *     consequence text
 *   - -> station_N+1   (or -> END for the last station)
 */
export function compileToInk(
  story: Story,
  options: { forReader?: boolean } = {}
): string {
  const forReader = options.forReader ?? false;
  const lines: string[] = [];

  // ── 1. Top-level VAR declarations ──────────────────────────────────────────

  // Character variables
  lines.push(`VAR character_name = "${escapeInkString(story.character.name)}"`);
  lines.push(`VAR character_strength = "${escapeInkString(story.character.strength)}"`);
  lines.push(`VAR character_weakness = "${escapeInkString(story.character.weakness)}"`);
  lines.push(`VAR character_goal = "${escapeInkString(story.character.goal)}"`);
  lines.push(
    `VAR character_secret = "${escapeInkString(story.character.secret ?? "")}"`
  );

  // Inventory items
  for (const item of story.inventory) {
    lines.push(`VAR has_${sanitizeIdentifier(item)} = false`);
  }

  lines.push("");

  // ── 2. Intro knot ──────────────────────────────────────────────────────────

  // Filter to stations that have content (non-empty text OR choices)
  const activeStations = story.stations.filter(
    (s) => s.text.trim().length > 0 || s.choices.length > 0
  );

  lines.push("=== intro ===");

  if (!forReader) {
    lines.push(
      `In einer Welt: {character_name} ist ${story.character.strength} und kämpft gegen ${escapeInkString(story.character.weakness)}.`
    );
    lines.push(`Welt: ${escapeInkString(story.world.description)}`);
    lines.push(`Problem: ${escapeInkString(story.world.problem)}`);
    lines.push(`Ziel: {character_goal}`);
  }

  if (activeStations.length > 0) {
    lines.push(`-> station_${activeStations[0].id}`);
  } else {
    lines.push("-> END");
  }

  // ── 3. Station knots ───────────────────────────────────────────────────────

  for (let i = 0; i < story.stations.length; i++) {
    const station = story.stations[i];
    const isLast = i === story.stations.length - 1;
    const nextStation = isLast ? null : story.stations[i + 1];

    lines.push("");
    lines.push(`=== station_${station.id} ===`);

    // Station body text (may be empty)
    if (station.text.trim().length > 0) {
      lines.push(station.text);
    }

    // Choices block
    if (station.choices.length > 0) {
      for (const choice of station.choices) {
        lines.push(`* [${choice.label}]`);
        lines.push(`  ${choice.consequence}`);
      }
      // Gather then divert
      if (nextStation) {
        lines.push(`- -> station_${nextStation.id}`);
      } else {
        lines.push("- -> END");
      }
    } else {
      // No choices — just divert forward
      if (nextStation) {
        lines.push(`-> station_${nextStation.id}`);
      } else {
        lines.push("-> END");
      }
    }
  }

  lines.push("");
  return lines.join("\n");
}

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Escape double quotes inside Ink string literals.
 */
function escapeInkString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Convert an arbitrary string to a safe Ink variable name suffix.
 * Replaces spaces and non-alphanumeric characters with underscores.
 */
function sanitizeIdentifier(value: string): string {
  return value.replace(/[^a-zA-Z0-9_äöüÄÖÜß]/g, "_");
}
