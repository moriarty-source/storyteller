"use client";

import { useState, useRef, useCallback } from "react";
import type { Character, World, Strength } from "@/types/story";

interface CharacterSheetProps {
  character: Character;
  world: World;
  onCharacterChange: (character: Character) => void;
  onWorldChange: (world: World) => void;
  onComplete: () => void;
}

const STRENGTHS: Strength[] = ["Mutig", "Schlau", "Einfühlsam", "Stark"];

function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  id,
  minRows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
  minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const el = e.currentTarget;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
      onChange(el.value);
    },
    [onChange]
  );

  return (
    <textarea
      ref={ref}
      id={id}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      rows={minRows}
      className={[
        "w-full resize-none rounded-xl border-2 border-gray-200 bg-white px-4 py-3",
        "text-[var(--color-text)] placeholder-gray-400",
        "focus:border-[var(--color-amber)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/20",
        "transition-colors duration-150 leading-relaxed overflow-hidden",
      ].join(" ")}
      style={{ fontSize: "1rem", minHeight: `${minRows * 1.75 + 1.5}rem` }}
    />
  );
}

function FieldLabel({
  htmlFor,
  children,
  optional,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-gray-700">
      {children}
      {optional && (
        <span className="ml-2 text-xs font-normal text-gray-400">(optional)</span>
      )}
    </label>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={[
        "w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3",
        "text-[var(--color-text)] placeholder-gray-400",
        "focus:border-[var(--color-amber)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/20",
        "transition-colors duration-150",
      ].join(" ")}
      style={{ fontSize: "1rem" }}
    />
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="mb-10 flex items-center justify-center gap-4">
      {/* Step 1 */}
      <div className="flex flex-col items-center gap-1">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300"
          style={
            step === 1
              ? { background: "var(--color-amber)", color: "#fff" }
              : { background: "var(--color-indigo)", color: "#fff" }
          }
        >
          {step === 1 ? "1" : "✓"}
        </div>
        <span
          className="text-xs font-semibold tracking-wide uppercase"
          style={{ color: step === 1 ? "var(--color-amber)" : "var(--color-indigo)" }}
        >
          Meine Welt
        </span>
      </div>

      {/* Connector */}
      <div
        className="mb-5 h-0.5 w-12 rounded-full transition-all duration-500"
        style={{
          background: step === 2 ? "var(--color-indigo)" : "#e5e7eb",
        }}
      />

      {/* Step 2 */}
      <div className="flex flex-col items-center gap-1">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300"
          style={
            step === 2
              ? { background: "var(--color-amber)", color: "#fff" }
              : { background: "#e5e7eb", color: "#9ca3af" }
          }
        >
          2
        </div>
        <span
          className="text-xs font-semibold tracking-wide uppercase"
          style={{ color: step === 2 ? "var(--color-amber)" : "#9ca3af" }}
        >
          Meine Figur
        </span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function CharacterSheet({
  character,
  world,
  onCharacterChange,
  onWorldChange,
  onComplete,
}: CharacterSheetProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const worldComplete =
    world.description.trim().length > 0 &&
    world.problem.trim().length > 0;

  const characterComplete =
    character.name.trim().length > 0 &&
    character.strength !== undefined &&
    character.weakness.trim().length > 0 &&
    character.goal.trim().length > 0;

  function updateWorld<K extends keyof World>(key: K, value: World[K]) {
    onWorldChange({ ...world, [key]: value });
  }

  function updateCharacter<K extends keyof Character>(key: K, value: Character[K]) {
    onCharacterChange({ ...character, [key]: value });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8" style={{ color: "var(--color-text)" }}>

      {/* Step indicator */}
      <StepIndicator step={step} />

      {/* ── SCHRITT 1: MEINE WELT ── */}
      {step === 1 && (
        <div
          className="animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold" style={{ color: "var(--color-text)" }}>
              Meine Welt
            </h1>
            <p className="mt-2 text-gray-500">
              Beschreibe die Welt, in der deine Geschichte spielt.
            </p>
          </div>

          <section className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="space-y-5">
              <div>
                <FieldLabel htmlFor="world-description">
                  Wie sieht die Welt aus?
                </FieldLabel>
                <AutoGrowTextarea
                  id="world-description"
                  value={world.description}
                  onChange={(v) => updateWorld("description", v)}
                  placeholder="Beschreibe die Welt — Landschaft, Zeit, Atmosphäre …"
                />
              </div>
              <div>
                <FieldLabel htmlFor="world-problem">
                  Was ist das größte Problem?
                </FieldLabel>
                <AutoGrowTextarea
                  id="world-problem"
                  value={world.problem}
                  onChange={(v) => updateWorld("problem", v)}
                  placeholder="Welches Problem oder welche Bedrohung prägt diese Welt?"
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!worldComplete}
              className={[
                "w-full max-w-sm rounded-2xl px-8 py-4 text-lg font-bold min-h-[56px]",
                "transition-all duration-200",
                worldComplete
                  ? "shadow-lg active:scale-95 hover:brightness-105"
                  : "cursor-not-allowed opacity-40",
              ].join(" ")}
              style={{ background: "var(--color-amber)", color: "#fff" }}
              aria-disabled={!worldComplete}
            >
              Weiter zu meiner Figur →
            </button>
            {!worldComplete && (
              <p className="text-center text-xs text-gray-400">
                Bitte fülle beide Felder aus, um fortzufahren.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── SCHRITT 2: MEINE FIGUR ── */}
      {step === 2 && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold" style={{ color: "var(--color-text)" }}>
              Meine Figur
            </h1>
            <p className="mt-2 text-gray-500">
              Gib deinem Charakter Leben.
            </p>
          </div>

          <section className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="space-y-5">
              {/* Name */}
              <div>
                <FieldLabel htmlFor="char-name">Name</FieldLabel>
                <TextInput
                  id="char-name"
                  value={character.name}
                  onChange={(v) => updateCharacter("name", v)}
                  placeholder="Wie heißt dein Charakter?"
                />
              </div>

              {/* Stärke */}
              <div>
                <FieldLabel>Stärke</FieldLabel>
                <div className="flex flex-wrap gap-3">
                  {STRENGTHS.map((s) => {
                    const selected = character.strength === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateCharacter("strength", s)}
                        className={[
                          "rounded-full border-2 px-5 py-2.5 text-sm font-semibold",
                          "transition-all duration-200 active:scale-95 min-h-[44px]",
                          selected
                            ? "scale-105 border-[var(--color-amber)] shadow-md"
                            : "border-gray-200 bg-white text-gray-600 hover:border-[var(--color-amber)]",
                        ].join(" ")}
                        style={selected ? { background: "var(--color-amber)", color: "#fff" } : {}}
                        aria-pressed={selected}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Schwäche */}
              <div>
                <FieldLabel htmlFor="char-weakness">Schwäche</FieldLabel>
                <TextInput
                  id="char-weakness"
                  value={character.weakness}
                  onChange={(v) => updateCharacter("weakness", v)}
                  placeholder="Was ist die größte Schwäche deines Charakters?"
                />
              </div>

              {/* Ziel */}
              <div>
                <FieldLabel htmlFor="char-goal">Ziel</FieldLabel>
                <TextInput
                  id="char-goal"
                  value={character.goal}
                  onChange={(v) => updateCharacter("goal", v)}
                  placeholder="Was will dein Charakter erreichen?"
                />
              </div>

              {/* Geheimnis */}
              <div>
                <FieldLabel htmlFor="char-secret" optional>
                  Geheimnis
                </FieldLabel>
                <TextInput
                  id="char-secret"
                  value={character.secret ?? ""}
                  onChange={(v) => updateCharacter("secret", v || undefined)}
                  placeholder="Hat dein Charakter ein Geheimnis?"
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={onComplete}
              disabled={!characterComplete}
              className={[
                "w-full max-w-sm rounded-2xl px-8 py-4 text-lg font-bold min-h-[56px]",
                "transition-all duration-200",
                characterComplete
                  ? "shadow-lg active:scale-95 hover:brightness-105"
                  : "cursor-not-allowed opacity-40",
              ].join(" ")}
              style={{ background: "var(--color-amber)", color: "#fff" }}
              aria-disabled={!characterComplete}
            >
              Weiter zum Abenteuer →
            </button>

            {!characterComplete && (
              <p className="text-center text-xs text-gray-400">
                Bitte fülle alle Pflichtfelder aus, um fortzufahren.
              </p>
            )}

            {/* Back button */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-1 text-sm text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline active:scale-95"
            >
              ← Zurück zu Meine Welt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
