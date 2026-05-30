"use client";

import { useRef, useCallback } from "react";
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
      // Reset height so shrink works correctly
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
        "transition-colors duration-150 leading-relaxed",
        "overflow-hidden",
      ].join(" ")}
      style={{ fontSize: "1rem", minHeight: `${minRows * 1.75 + 1.5}rem` }}
    />
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2
        className="text-xl font-bold tracking-widest uppercase"
        style={{ color: "var(--color-amber)" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      )}
      <div
        className="mt-2 h-px w-full"
        style={{ background: "linear-gradient(to right, var(--color-amber), transparent)" }}
      />
    </div>
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
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-semibold text-gray-700"
    >
      {children}
      {optional && (
        <span className="ml-2 text-xs font-normal text-gray-400">(optional)</span>
      )}
    </label>
  );
}

export default function CharacterSheet({
  character,
  world,
  onCharacterChange,
  onWorldChange,
  onComplete,
}: CharacterSheetProps) {
  const isComplete =
    world.description.trim().length > 0 &&
    world.problem.trim().length > 0 &&
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
    <div
      className="mx-auto w-full max-w-2xl px-4 py-8"
      style={{ color: "var(--color-text)" }}
    >
      {/* Page title */}
      <div className="mb-10 text-center">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
          Station 0
        </p>
        <h1 className="text-3xl font-extrabold" style={{ color: "var(--color-text)" }}>
          Mein Charakter-Bogen
        </h1>
        <p className="mt-2 text-gray-500">
          Erschaffe deine Welt und deinen Charakter, bevor das Abenteuer beginnt.
        </p>
      </div>

      {/* ── MEINE WELT ── */}
      <section
        className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        style={{ background: "var(--color-bg)" }}
      >
        <SectionHeader title="Meine Welt" subtitle="Beschreibe die Welt, in der deine Geschichte spielt." />

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

      {/* ── MEINE FIGUR ── */}
      <section
        className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        style={{ background: "var(--color-bg)" }}
      >
        <SectionHeader title="Meine Figur" subtitle="Gib deinem Charakter Leben." />

        <div className="space-y-5">
          {/* Name */}
          <div>
            <FieldLabel htmlFor="char-name">Name</FieldLabel>
            <input
              id="char-name"
              type="text"
              value={character.name}
              onChange={(e) => updateCharacter("name", e.target.value)}
              placeholder="Wie heißt dein Charakter?"
              className={[
                "w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3",
                "text-[var(--color-text)] placeholder-gray-400",
                "focus:border-[var(--color-amber)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/20",
                "transition-colors duration-150",
              ].join(" ")}
              style={{ fontSize: "1rem" }}
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
                      "transition-all duration-200 active:scale-95",
                      "min-h-[44px]", // large touch target
                      selected
                        ? "scale-105 border-[var(--color-amber)] shadow-md"
                        : "border-gray-200 bg-white text-gray-600 hover:border-[var(--color-amber)] hover:text-[var(--color-text)]",
                    ].join(" ")}
                    style={
                      selected
                        ? {
                            background: "var(--color-amber)",
                            color: "#fff",
                          }
                        : {}
                    }
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
            <input
              id="char-weakness"
              type="text"
              value={character.weakness}
              onChange={(e) => updateCharacter("weakness", e.target.value)}
              placeholder="Was ist die größte Schwäche deines Charakters?"
              className={[
                "w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3",
                "text-[var(--color-text)] placeholder-gray-400",
                "focus:border-[var(--color-amber)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/20",
                "transition-colors duration-150",
              ].join(" ")}
              style={{ fontSize: "1rem" }}
            />
          </div>

          {/* Ziel */}
          <div>
            <FieldLabel htmlFor="char-goal">Ziel</FieldLabel>
            <input
              id="char-goal"
              type="text"
              value={character.goal}
              onChange={(e) => updateCharacter("goal", e.target.value)}
              placeholder="Was will dein Charakter erreichen?"
              className={[
                "w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3",
                "text-[var(--color-text)] placeholder-gray-400",
                "focus:border-[var(--color-amber)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/20",
                "transition-colors duration-150",
              ].join(" ")}
              style={{ fontSize: "1rem" }}
            />
          </div>

          {/* Geheimnis (optional) */}
          <div>
            <FieldLabel htmlFor="char-secret" optional>
              Geheimnis
            </FieldLabel>
            <input
              id="char-secret"
              type="text"
              value={character.secret ?? ""}
              onChange={(e) =>
                updateCharacter("secret", e.target.value || undefined)
              }
              placeholder="Hat dein Charakter ein Geheimnis?"
              className={[
                "w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3",
                "text-[var(--color-text)] placeholder-gray-400",
                "focus:border-[var(--color-amber)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/20",
                "transition-colors duration-150",
              ].join(" ")}
              style={{ fontSize: "1rem" }}
            />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onComplete}
          disabled={!isComplete}
          className={[
            "w-full max-w-sm rounded-2xl px-8 py-4 text-lg font-bold",
            "transition-all duration-200",
            "min-h-[56px]", // large touch target
            isComplete
              ? [
                  "shadow-lg active:scale-95 active:shadow-md",
                  "hover:brightness-105",
                ].join(" ")
              : "cursor-not-allowed opacity-40",
          ].join(" ")}
          style={
            isComplete
              ? {
                  background: "var(--color-amber)",
                  color: "#fff",
                }
              : {
                  background: "var(--color-amber)",
                  color: "#fff",
                }
          }
          aria-disabled={!isComplete}
        >
          Weiter zum Abenteuer →
        </button>

        {!isComplete && (
          <p className="text-center text-xs text-gray-400">
            Bitte fülle alle Pflichtfelder aus, um fortzufahren.
          </p>
        )}
      </div>
    </div>
  );
}
