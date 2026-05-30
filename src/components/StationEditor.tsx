"use client";

import { useState, useRef, useCallback } from "react";
import type { Station, StationMeta, Choice } from "@/types/story";
import {
  countWords,
  shouldShowHint,
  canUnlockChoices,
} from "@/lib/wordCount";
import WordCounter from "@/components/WordCounter";
import ChoiceCard from "@/components/ChoiceCard";

interface StationEditorProps {
  station: Station;
  meta: StationMeta;
  wordLimit: number;
  consequenceLimit: number;
  onStationChange: (station: Station) => void;
}

function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  id,
  minRows = 4,
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

export default function StationEditor({
  station,
  meta,
  wordLimit,
  consequenceLimit,
  onStationChange,
}: StationEditorProps) {
  const [hintExpanded, setHintExpanded] = useState(false);

  const wordCount = countWords(station.text);
  const showWordHint = shouldShowHint(station.text, wordLimit);
  const choicesUnlocked = canUnlockChoices(station.text);
  const hasChoiceSection = meta.minChoices > 0 || meta.maxChoices > 0;

  function updateText(text: string) {
    onStationChange({ ...station, text });
  }

  function updateChoice(index: number, choice: Choice) {
    const choices = station.choices.map((c, i) => (i === index ? choice : c));
    onStationChange({ ...station, choices });
  }

  function addChoice() {
    if (station.choices.length >= meta.maxChoices) return;
    const newChoice: Choice = { label: "", consequence: "" };
    onStationChange({ ...station, choices: [...station.choices, newChoice] });
  }

  function removeChoice(index: number) {
    if (station.choices.length <= meta.minChoices) return;
    const choices = station.choices.filter((_, i) => i !== index);
    onStationChange({ ...station, choices });
  }

  const canAddChoice =
    choicesUnlocked && station.choices.length < meta.maxChoices;

  return (
    <div
      className="mx-auto w-full max-w-2xl px-4 py-8 space-y-6"
      style={{ color: "var(--color-text)" }}
    >
      {/* Station title */}
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
          Station {meta.id}
        </p>
        <h2 className="text-2xl font-extrabold" style={{ color: "var(--color-text)" }}>
          {meta.title}
        </h2>
      </div>

      {/* Hint block */}
      <div
        className="rounded-xl border border-gray-200 bg-[var(--color-bg-muted)] px-4 py-3 text-sm text-gray-600"
      >
        <p>{meta.hint}</p>
        {hintExpanded && (
          <p className="mt-2 text-gray-500">{meta.expandedHint}</p>
        )}
        <button
          type="button"
          onClick={() => setHintExpanded((v) => !v)}
          className="mt-2 text-xs font-semibold text-[var(--color-indigo)] hover:underline focus:outline-none"
        >
          {hintExpanded ? "Weniger ▲" : "Mehr Hilfe ▼"}
        </button>
      </div>

      {/* Main textarea */}
      <div>
        <label
          htmlFor={`station-text-${station.id}`}
          className="mb-1.5 block text-sm font-semibold text-gray-700"
        >
          Deine Geschichte
        </label>
        <AutoGrowTextarea
          id={`station-text-${station.id}`}
          value={station.text}
          onChange={updateText}
          placeholder="Schreibe hier deine Geschichte …"
          minRows={6}
        />
        <WordCounter count={wordCount} limit={wordLimit} />
      </div>

      {/* Word-limit approach hint */}
      {showWordHint && (
        <div
          className="rounded-xl px-4 py-3 text-sm font-medium animate-in fade-in duration-300"
          style={{
            background: "var(--color-amber-light)",
            color: "#92400E",
          }}
        >
          Tipp: Arbeite auf eine Entscheidung hin!
        </div>
      )}

      {/* Choice section — only if station has choices */}
      {hasChoiceSection && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
              Entscheidungen
            </h3>
            <div
              className="h-px flex-1"
              style={{
                background:
                  "linear-gradient(to right, var(--color-amber), transparent)",
              }}
            />
          </div>

          {/* Choice cards */}
          <div className="space-y-4">
            {station.choices.map((choice, i) => (
              <ChoiceCard
                key={i}
                index={i}
                choice={choice}
                consequenceLimit={consequenceLimit}
                onChange={(c) => updateChoice(i, c)}
                onRemove={() => removeChoice(i)}
                canRemove={station.choices.length > meta.minChoices}
              />
            ))}
          </div>

          {/* Add choice button */}
          {canAddChoice && (
            <button
              type="button"
              onClick={addChoice}
              className={[
                "flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed",
                "border-gray-300 px-6 py-3 text-sm font-semibold text-gray-500",
                "hover:border-[var(--color-amber)] hover:text-[var(--color-amber)]",
                "transition-colors duration-200 min-h-[48px]",
              ].join(" ")}
            >
              <span aria-hidden="true">+</span> Entscheidung hinzufügen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
