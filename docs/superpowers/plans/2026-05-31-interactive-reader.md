# Interactive Story Reader — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an interactive Ink.js-powered story reader at `/story/[code]/read` so finished stories can be played through with branching choices.

**Architecture:** The server compiles the Ink source to JSON (via `inkjs` Compiler) and serves it through a new API endpoint. A client-side `StoryReader` component runs the Story runtime, displays one "page" at a time (Buchseiten-Stil), and tracks which choices were made for a final summary screen. Completed stories redirect to `/read` instead of the existing static `/view`.

**Tech Stack:** Next.js 16 App Router, TypeScript, inkjs (Compiler server-side, Story runtime client-side), React, Tailwind CSS v4

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/inkCompiler.ts` | Modify | Add `forReader` option — skips auto-generated intro text so the reader starts cleanly at station 1 |
| `src/app/api/stories/[code]/ink-json/route.ts` | **Create** | Compiles story → Ink JSON server-side, returns `{ json: string }` |
| `src/app/story/[code]/page.tsx` | Modify | Redirect completed stories to `/read` instead of `/view` |
| `src/app/story/[code]/read/page.tsx` | **Create** | Server component: load story, guard against non-completed, pass to reader |
| `src/components/StoryReader.tsx` | **Create** | Full reader UI: cover → page-by-page → summary |
| `src/__tests__/inkCompiler.test.ts` | Modify | Add tests for `forReader: true` option |

---

## Task 1 — Extend inkCompiler with `forReader` option

**Files:**
- Modify: `src/lib/inkCompiler.ts`
- Modify: `src/__tests__/inkCompiler.test.ts`

When `forReader: true`, the intro knot emits no narrative text — just the divert. The reader will show a styled cover screen (world/character data) using the story object directly. This prevents auto-generated "In einer Welt: Lena ist Mutig…" text from appearing as story prose.

- [ ] **Step 1: Write failing tests**

Add to the bottom of `src/__tests__/inkCompiler.test.ts` (before the closing `}`):

```typescript
describe("compileToInk with forReader option", () => {
  it("omits intro narrative text when forReader is true", () => {
    const story = makeStory();
    const ink = compileToInk(story, { forReader: true });
    // intro knot must exist but produce no narrative text
    expect(ink).toContain("=== intro ===");
    // auto-generated narrative lines must NOT appear
    expect(ink).not.toContain("In einer Welt:");
    expect(ink).not.toContain("Welt:");
    expect(ink).not.toContain("Problem:");
    expect(ink).not.toContain("Ziel:");
    // divert still present
    expect(ink).toContain("-> station_1");
  });

  it("still includes all station text and choices when forReader is true", () => {
    const story = makeStory({
      stations: [makeStation(1), makeStation(2)],
    });
    const ink = compileToInk(story, { forReader: true });
    expect(ink).toContain("=== station_1 ===");
    expect(ink).toContain("Station 1 Text");
    expect(ink).toContain("* [Wahl A]");
    expect(ink).toContain("Konsequenz A");
    expect(ink).toContain("-> station_2");
  });

  it("does not affect output when forReader is false (default behaviour)", () => {
    const story = makeStory();
    const inkDefault = compileToInk(story);
    const inkExplicitFalse = compileToInk(story, { forReader: false });
    expect(inkDefault).toBe(inkExplicitFalse);
    // narrative text still present
    expect(inkDefault).toContain("In einer Welt:");
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx jest inkCompiler --no-coverage 2>&1 | tail -20
```

Expected: 3 new tests fail with "Expected: not containing / toContain".

- [ ] **Step 3: Implement `forReader` option**

Replace the `compileToInk` signature and intro section in `src/lib/inkCompiler.ts`:

```typescript
export function compileToInk(
  story: Story,
  options: { forReader?: boolean } = {}
): string {
  const forReader = options.forReader ?? false;
  const lines: string[] = [];

  // ── 1. VAR declarations (unchanged) ──────────────────────────────────────
  lines.push(`VAR character_name = "${escapeInkString(story.character.name)}"`);
  lines.push(`VAR character_strength = "${escapeInkString(story.character.strength)}"`);
  lines.push(`VAR character_weakness = "${escapeInkString(story.character.weakness)}"`);
  lines.push(`VAR character_goal = "${escapeInkString(story.character.goal)}"`);
  lines.push(
    `VAR character_secret = "${escapeInkString(story.character.secret ?? "")}"`
  );
  for (const item of story.inventory) {
    lines.push(`VAR has_${sanitizeIdentifier(item)} = false`);
  }
  lines.push("");

  // ── 2. Intro knot ─────────────────────────────────────────────────────────
  const activeStations = story.stations.filter(
    (s) => s.text.trim().length > 0 || s.choices.length > 0
  );

  lines.push("=== intro ===");

  if (!forReader) {
    // Include narrative intro text for non-reader uses (e.g. raw Ink export)
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

  // ── 3. Station knots (unchanged) ─────────────────────────────────────────
  for (let i = 0; i < story.stations.length; i++) {
    const station = story.stations[i];
    const isLast = i === story.stations.length - 1;
    const nextStation = isLast ? null : story.stations[i + 1];

    lines.push("");
    lines.push(`=== station_${station.id} ===`);

    if (station.text.trim().length > 0) {
      lines.push(station.text);
    }

    if (station.choices.length > 0) {
      for (const choice of station.choices) {
        lines.push(`* [${choice.label}]`);
        lines.push(`  ${choice.consequence}`);
      }
      if (nextStation) {
        lines.push(`- -> station_${nextStation.id}`);
      } else {
        lines.push("- -> END");
      }
    } else {
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
```

- [ ] **Step 4: Run all tests — verify all pass**

```bash
npx jest --no-coverage 2>&1 | tail -15
```

Expected: all tests pass, including the 3 new ones.

- [ ] **Step 5: Commit**

```bash
git add src/lib/inkCompiler.ts src/__tests__/inkCompiler.test.ts
git commit -m "feat: add forReader option to compileToInk — omits intro narrative text"
```

---

## Task 2 — Ink-JSON API endpoint

**Files:**
- Create: `src/app/api/stories/[code]/ink-json/route.ts`

Compiles the story's Ink source to a JSON string server-side using `inkjs` Compiler. The client StoryReader fetches this JSON and runs it via `new Story(json)`.

- [ ] **Step 1: Create the route file**

```typescript
// src/app/api/stories/[code]/ink-json/route.ts
import { NextResponse } from "next/server";
import { getStory } from "@/lib/stories";
import { compileToInk } from "@/lib/inkCompiler";
import { Compiler } from "inkjs/compiler/Compiler";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { code } = await params;
  const story = getStory(code.toUpperCase());

  if (!story) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (story.status !== "completed") {
    return NextResponse.json({ error: "Story not completed" }, { status: 403 });
  }

  try {
    const inkSource = compileToInk(story, { forReader: true });
    const compiler = new Compiler(inkSource);
    const compiled = compiler.Compile();
    const json = compiled.ToJson();
    return NextResponse.json({ json });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Ink compilation failed: ${message}` },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Build — verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 3: Manual smoke test**

Start dev server (`npm run dev`), create a completed story in the DB, then:

```bash
curl http://localhost:3000/api/stories/TEST/ink-json
```

Expected: `{ "json": "{ ... }" }` with a valid Ink JSON string.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/stories/[code]/ink-json/route.ts
git commit -m "feat: add GET /api/stories/[code]/ink-json — server-side Ink compilation"
```

---

## Task 3 — Fix redirect: completed stories go to /read

**Files:**
- Modify: `src/app/story/[code]/page.tsx` line 20

- [ ] **Step 1: Change the redirect**

Replace line 20 in `src/app/story/[code]/page.tsx`:

Old:
```typescript
  if (story.status === "completed") {
    redirect(`/story/${code}/view`);
  }
```

New:
```typescript
  if (story.status === "completed") {
    redirect(`/story/${code}/read`);
  }
```

- [ ] **Step 2: Verify build**

```bash
npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/story/[code]/page.tsx
git commit -m "fix: redirect completed stories to /read instead of /view"
```

---

## Task 4 — StoryReader component

**Files:**
- Create: `src/components/StoryReader.tsx`

This is the core of the feature. It manages three phases:
- `"cover"` — styled title screen using story metadata, "Lesen beginnen" CTA
- `"reading"` — one page at a time: optional consequence amber-box + main text + choice buttons (or "Ende" button for station 6)
- `"summary"` — "Dein Weg" screen listing all choices made

**Ink execution model:**
- `fetchInkJson()` → `GET /api/stories/[code]/ink-json` → `new Story(json)`
- `collectUntilChoice(story)` → calls `story.Continue()` repeatedly, returns array of text paragraphs
- On `handleChoice(i, label)`:
  1. Push `{ stationId, stationTitle, choiceLabel: label }` to choicesMade
  2. Call `story.choose(i)` on the inkjs Story
  3. Call `collectUntilChoice` — first paragraph = consequence, rest = next station's text
- When `story.currentChoices.length === 0` after collect → last station, show "Ende" button
- "Ende" button click → `phase = "summary"`

**Station ID tracking:** `choicesMade.length + 1` = current station ID (1-based).

- [ ] **Step 1: Create the file**

```typescript
// src/components/StoryReader.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Story as InkStory } from "inkjs";
import { STATIONS } from "@/types/story";
import type { Story } from "@/types/story";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChoiceMade {
  stationId: number;
  stationTitle: string;
  choiceLabel: string;
}

interface ReaderPage {
  stationId: number;
  stationTitle: string;
  consequence?: { choiceLabel: string; text: string };
  mainTextParagraphs: string[];
  choices: string[]; // empty = last station, show "Ende" button
}

type Phase =
  | { kind: "cover" }
  | { kind: "loading" }
  | { kind: "reading"; page: ReaderPage }
  | { kind: "summary"; choicesMade: ChoiceMade[] }
  | { kind: "error"; message: string };

interface StoryReaderProps {
  story: Story;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function collectUntilChoice(inkStory: InkStory): string[] {
  const paragraphs: string[] = [];
  while (inkStory.canContinue) {
    const text = inkStory.Continue();
    if (text && text.trim()) paragraphs.push(text.trim());
  }
  return paragraphs;
}

function stationTitleById(id: number): string {
  return STATIONS.find((s) => s.id === id)?.title ?? `Station ${id}`;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StoryReader({ story }: StoryReaderProps) {
  const [phase, setPhase] = useState<Phase>({ kind: "cover" });
  const inkRef = useRef<InkStory | null>(null);
  const choicesMadeRef = useRef<ChoiceMade[]>([]);

  // Advance the ink story and build the next ReaderPage
  function advance(prevChoiceLabel: string | null) {
    const inkStory = inkRef.current!;
    const paragraphs = collectUntilChoice(inkStory);
    const choices = inkStory.currentChoices.map((c) => c.text);

    const stationId = choicesMadeRef.current.length + 1;
    const stationTitle = stationTitleById(stationId);

    let consequence: ReaderPage["consequence"];
    let mainTextParagraphs: string[];

    if (prevChoiceLabel !== null && paragraphs.length > 0) {
      // First paragraph after a choice = consequence text
      consequence = { choiceLabel: prevChoiceLabel, text: paragraphs[0] };
      mainTextParagraphs = paragraphs.slice(1);
    } else {
      mainTextParagraphs = paragraphs;
    }

    if (choices.length === 0 && !inkStory.canContinue) {
      // Reached END — show summary immediately
      setPhase({ kind: "summary", choicesMade: choicesMadeRef.current });
      return;
    }

    setPhase({
      kind: "reading",
      page: { stationId, stationTitle, consequence, mainTextParagraphs, choices },
    });
  }

  async function handleStart() {
    setPhase({ kind: "loading" });
    try {
      const res = await fetch(`/api/stories/${story.code}/ink-json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { json } = (await res.json()) as { json: string };
      inkRef.current = new InkStory(json);
      choicesMadeRef.current = [];
      advance(null);
    } catch (err) {
      setPhase({
        kind: "error",
        message: err instanceof Error ? err.message : "Unbekannter Fehler",
      });
    }
  }

  function handleChoice(index: number, label: string) {
    const inkStory = inkRef.current!;
    const page = (phase as { kind: "reading"; page: ReaderPage }).page;

    choicesMadeRef.current = [
      ...choicesMadeRef.current,
      { stationId: page.stationId, stationTitle: page.stationTitle, choiceLabel: label },
    ];

    inkStory.choose(index);
    advance(label);
  }

  function handleEnd() {
    setPhase({ kind: "summary", choicesMade: choicesMadeRef.current });
  }

  function handleRestart() {
    inkRef.current = null;
    choicesMadeRef.current = [];
    setPhase({ kind: "cover" });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const TOTAL_STATIONS = 6;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-muted)" }}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <span
            className="text-sm font-black uppercase tracking-[0.3em]"
            style={{ color: "var(--color-text)" }}
          >
            Story Maker
          </span>
          <span
            className="font-mono text-lg font-extrabold tracking-widest"
            style={{ color: "var(--color-amber)" }}
          >
            {story.code}
          </span>
        </div>

        {/* Progress dots */}
        {(phase.kind === "reading" || phase.kind === "summary") && (
          <div className="mt-2 flex justify-center gap-2">
            {Array.from({ length: TOTAL_STATIONS }).map((_, i) => {
              const stationId = i + 1;
              const currentId =
                phase.kind === "reading" ? phase.page.stationId : TOTAL_STATIONS + 1;
              const done = stationId < currentId;
              const active = stationId === currentId;
              return (
                <div
                  key={i}
                  className="h-2 w-2 rounded-full transition-all duration-300"
                  style={{
                    background: active
                      ? "var(--color-amber)"
                      : done
                      ? "var(--color-indigo)"
                      : "#e5e7eb",
                  }}
                />
              );
            })}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-xl px-4 py-8">
        {/* ── COVER ── */}
        {phase.kind === "cover" && (
          <div className="space-y-6 text-center">
            <div className="text-5xl">🌟</div>
            <h1
              className="text-3xl font-extrabold tracking-tight"
              style={{ color: "var(--color-text)" }}
            >
              {story.character.name}s Abenteuer
            </h1>

            {/* World + character info */}
            <div
              className="rounded-2xl border border-gray-200 bg-white p-5 text-left space-y-3"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Die Welt
              </p>
              <p className="text-sm leading-relaxed text-gray-700">
                {story.world.description}
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Problem:</span> {story.world.problem}
              </p>
              <hr className="border-gray-100" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Unsere Heldin / Unser Held
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{story.character.name}</span> —{" "}
                {story.character.strength}, aber {story.character.weakness}.
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Ziel:</span> {story.character.goal}
              </p>
              {story.inventory.length > 0 && (
                <p className="text-xs text-gray-500">
                  🎒 {story.inventory.join(", ")}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleStart}
              className="w-full rounded-2xl px-6 py-4 text-lg font-bold text-white shadow-lg hover:brightness-105 active:scale-[0.98] transition-all min-h-[56px]"
              style={{ background: "var(--color-amber)" }}
            >
              Lesen beginnen →
            </button>
          </div>
        )}

        {/* ── LOADING ── */}
        {phase.kind === "loading" && (
          <div className="flex flex-col items-center gap-4 py-16 text-gray-400">
            <div
              className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200"
              style={{ borderTopColor: "var(--color-amber)" }}
            />
            <p className="text-sm">Geschichte wird geladen …</p>
          </div>
        )}

        {/* ── READING ── */}
        {phase.kind === "reading" && (
          <div className="space-y-6">
            {/* Station title */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
                Station {phase.page.stationId} von {TOTAL_STATIONS}
              </p>
              <h2
                className="mt-1 text-2xl font-extrabold"
                style={{ color: "var(--color-text)" }}
              >
                {phase.page.stationTitle}
              </h2>
            </div>

            {/* Consequence box (shown when arriving from a choice) */}
            {phase.page.consequence && (
              <div
                className="rounded-xl px-4 py-3 space-y-1"
                style={{ background: "var(--color-amber-light)" }}
              >
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#92400E" }}>
                  Deine Wahl: {phase.page.consequence.choiceLabel}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#78350F" }}>
                  {phase.page.consequence.text}
                </p>
              </div>
            )}

            {/* Main station text */}
            {phase.page.mainTextParagraphs.length > 0 && (
              <div className="space-y-3">
                {phase.page.mainTextParagraphs.map((p, i) => (
                  <p key={i} className="text-base leading-relaxed text-gray-800">
                    {p}
                  </p>
                ))}
              </div>
            )}

            {/* Choices */}
            {phase.page.choices.length > 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Was passiert als nächstes?
                </p>
                {phase.page.choices.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleChoice(i, label)}
                    className={[
                      "flex w-full items-center gap-3 rounded-2xl border-2 border-gray-200 bg-white",
                      "px-5 py-4 text-left text-sm font-semibold text-gray-800",
                      "hover:border-[var(--color-amber)] hover:bg-[var(--color-amber-light)]",
                      "active:scale-[0.98] transition-all duration-150 min-h-[56px]",
                    ].join(" ")}
                  >
                    <span
                      className="shrink-0 text-base font-bold"
                      style={{ color: "var(--color-amber)" }}
                    >
                      ▸
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Last station — no choices, show Ende button */}
            {phase.page.choices.length === 0 && (
              <button
                type="button"
                onClick={handleEnd}
                className="w-full rounded-2xl px-6 py-4 text-base font-bold text-white shadow-lg hover:brightness-105 active:scale-[0.98] transition-all min-h-[56px]"
                style={{ background: "var(--color-indigo)" }}
              >
                Geschichte beendet — meinen Weg sehen ✓
              </button>
            )}
          </div>
        )}

        {/* ── SUMMARY ── */}
        {phase.kind === "summary" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-4xl">🌟</div>
              <h2
                className="text-2xl font-extrabold"
                style={{ color: "var(--color-text)" }}
              >
                Dein Weg durch die Geschichte
              </h2>
              <p className="text-sm text-gray-500">
                {story.character.name}s Abenteuer ist beendet.
              </p>
            </div>

            {/* Choices made */}
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              {phase.choicesMade.map((choice, i) => (
                <div
                  key={i}
                  className={[
                    "flex items-start gap-3 px-4 py-3",
                    i < phase.choicesMade.length - 1 ? "border-b border-gray-100" : "",
                  ].join(" ")}
                >
                  <span
                    className="mt-0.5 shrink-0 font-mono text-xs font-bold"
                    style={{ color: "var(--color-amber)" }}
                  >
                    {toRoman(choice.stationId)}.
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {choice.stationTitle}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-800">
                      → {choice.choiceLabel}
                    </p>
                  </div>
                </div>
              ))}
              {phase.choicesMade.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-400">
                  Keine Entscheidungen getroffen.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleRestart}
                className={[
                  "w-full rounded-2xl border-2 border-gray-200 px-6 py-3.5 text-sm font-bold text-gray-700",
                  "hover:border-gray-300 active:scale-[0.98] transition-all min-h-[48px]",
                ].join(" ")}
              >
                🔄 Nochmal lesen
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {phase.kind === "error" && (
          <div className="space-y-4 text-center">
            <p className="text-2xl">⚠️</p>
            <p className="font-semibold text-gray-700">Geschichte konnte nicht geladen werden</p>
            <p className="text-sm text-gray-500">{phase.message}</p>
            <button
              type="button"
              onClick={handleStart}
              className="rounded-2xl px-6 py-3 text-sm font-bold text-white"
              style={{ background: "var(--color-amber)" }}
            >
              Erneut versuchen
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Utility ───────────────────────────────────────────────────────────────────

function toRoman(n: number): string {
  const map: Record<number, string> = {
    1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI",
  };
  return map[n] ?? String(n);
}
```

- [ ] **Step 2: Build — verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/StoryReader.tsx
git commit -m "feat: add StoryReader component — cover, page-by-page Ink playthrough, summary"
```

---

## Task 5 — Read page (server component)

**Files:**
- Create: `src/app/story/[code]/read/page.tsx`

Server component: loads story from DB, guards against non-existent/non-completed, passes to `StoryReader`.

- [ ] **Step 1: Create the file**

```typescript
// src/app/story/[code]/read/page.tsx
import { redirect } from "next/navigation";
import { getStory } from "@/lib/stories";
import StoryReader from "@/components/StoryReader";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function StoryReadPage({ params }: PageProps) {
  const { code } = await params;
  const story = getStory(code.toUpperCase());

  if (!story) {
    redirect("/");
  }

  if (story.status === "active") {
    redirect(`/story/${code}`);
  }

  return <StoryReader story={story} />;
}
```

- [ ] **Step 2: Full build**

```bash
npm run build 2>&1 | tail -12
```

Expected: build succeeds, `/story/[code]/read` appears as a dynamic route.

- [ ] **Step 3: Commit**

```bash
git add src/app/story/[code]/read/page.tsx
git commit -m "feat: add /story/[code]/read page — interactive story reader"
```

---

## Task 6 — End-to-end test + deploy

- [ ] **Step 1: Run all tests**

```bash
npx jest --no-coverage 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 2: Manual end-to-end flow**

1. Create new story via `POST /api/stories`
2. Fill character/world/stations with choices via `PUT /api/stories/[code]`
3. Mark as completed via `PUT /api/stories/[code]` with `{ status: "completed" }`
4. Enter code on homepage → should redirect to `/story/[code]/read`
5. Cover screen shows character name, world, "Lesen beginnen" button
6. Click "Lesen beginnen" → station 1 text + 2 choice buttons appear
7. Pick a choice → amber consequence box + station 2 text + choices
8. Continue through all 6 stations
9. Station 6 → "Geschichte beendet" button → summary screen with all 5 choices listed
10. "Nochmal lesen" → back to cover

- [ ] **Step 3: Deploy to Pi**

```powershell
./deploy.ps1
```

Expected output ends with:
```
Active: active (running)
[OK] Deployment successful!
App running at http://192.168.178.70:3000
```

---

## Self-Review

**Spec coverage check:**
- ✅ New `/story/[code]/read` route
- ✅ Redirect: completed → `/read` (Task 3)
- ✅ `/api/stories/[code]/ink-json` endpoint (Task 2)
- ✅ `forReader` option skips intro text (Task 1)
- ✅ Cover screen with world/character info (Task 4, cover phase)
- ✅ Buchseiten-Stil: one page at a time (Task 4, reading phase)
- ✅ Consequence amber-box (Task 4, `consequence` field)
- ✅ Progress dots in header (Task 4, header section)
- ✅ 56px+ choice buttons (Task 4, `min-h-[56px]`)
- ✅ Station 6 "Ende" button (Task 4, empty choices branch)
- ✅ Summary with all choices made (Task 4, summary phase)
- ✅ "Nochmal lesen" button (Task 4, summary actions)
- ✅ Error handling with retry (Task 4, error phase)
- ✅ `/story/[code]/view` unchanged (not touched)

**Placeholder check:** No TBDs, all code blocks complete.

**Type consistency:**
- `ChoiceMade.stationId` used in `handleChoice` (push) and summary render ✓
- `ReaderPage.choices: string[]` — built from `inkStory.currentChoices.map(c => c.text)` ✓
- `advance(null)` initial call matches `prevChoiceLabel: string | null` signature ✓
- `choicesMadeRef.current.length + 1` station tracking: 0 choices = station 1 ✓
