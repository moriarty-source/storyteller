// src/components/StoryReader.tsx
"use client";

import { useRef, useState } from "react";
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
  choices: string[];
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

function toRoman(n: number): string {
  const map: Record<number, string> = {
    1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI",
  };
  return map[n] ?? String(n);
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_STATIONS = 6;

// ── Main component ────────────────────────────────────────────────────────────

export default function StoryReader({ story }: StoryReaderProps) {
  const [phase, setPhase] = useState<Phase>({ kind: "cover" });
  const inkRef = useRef<InkStory | null>(null);
  const choicesMadeRef = useRef<ChoiceMade[]>([]);

  function advance(prevChoiceLabel: string | null) {
    const inkStory = inkRef.current!;
    const paragraphs = collectUntilChoice(inkStory);
    const choices = inkStory.currentChoices.map((c) => c.text);

    const stationId = choicesMadeRef.current.length + 1;
    const stationTitle = stationTitleById(stationId);

    let consequence: ReaderPage["consequence"];
    let mainTextParagraphs: string[];

    if (prevChoiceLabel !== null && paragraphs.length > 0) {
      consequence = { choiceLabel: prevChoiceLabel, text: paragraphs[0] };
      mainTextParagraphs = paragraphs.slice(1);
    } else {
      mainTextParagraphs = paragraphs;
    }

    if (consequence && !consequence.text.trim()) {
      mainTextParagraphs = [consequence.text, ...mainTextParagraphs].filter(t => t.trim());
      consequence = undefined;
    }

    if (choices.length === 0 && !inkStory.canContinue && mainTextParagraphs.length === 0 && !consequence) {
      // Reached END with nothing to display — go straight to summary
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
    if (phase.kind !== "reading") return;
    const inkStory = inkRef.current!;
    const page = phase.page;

    choicesMadeRef.current = [
      ...choicesMadeRef.current,
      { stationId: page.stationId, stationTitle: page.stationTitle, choiceLabel: label },
    ];

    inkStory.ChooseChoiceIndex(index);
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
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 leading-none mb-0.5">
              Dein persönlicher Story-Code
            </span>
            <span
              className="font-mono text-lg font-extrabold tracking-widest leading-none"
              style={{ color: "var(--color-amber)" }}
            >
              {story.code}
            </span>
          </div>
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

            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-left space-y-3">
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

            {phase.page.mainTextParagraphs.length > 0 && (
              <div className="space-y-3">
                {phase.page.mainTextParagraphs.map((p, i) => (
                  <p key={i} className="text-base leading-relaxed text-gray-800">
                    {p}
                  </p>
                ))}
              </div>
            )}

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
