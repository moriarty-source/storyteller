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
  previousStationText?: string;     // text from the station before this one
  previousStationTitle?: string;
  onAddInventoryItem?: (item: string) => void;
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

// Quick-add inventory item inline
function InventoryQuickAdd({ onAdd }: { onAdd: (item: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  function handleAdd() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          "inline-flex items-center gap-1.5 rounded-full border-2 border-dashed border-gray-300",
          "px-3 py-1.5 text-xs font-semibold text-gray-500",
          "hover:border-[var(--color-amber)] hover:text-[var(--color-amber)]",
          "transition-colors duration-150 min-h-[36px]",
        ].join(" ")}
      >
        🎒 Gegenstand gefunden!
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <input
        type="text"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
          if (e.key === "Escape") { setOpen(false); setValue(""); }
        }}
        placeholder="Was hast du gefunden?"
        className="rounded-lg border-2 border-gray-200 px-3 py-1.5 text-xs focus:border-[var(--color-amber)] focus:outline-none min-w-[160px]"
        style={{ fontSize: "1rem" }}
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={!value.trim()}
        className="rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
        style={{ background: "var(--color-amber)" }}
      >
        OK
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setValue(""); }}
        className="rounded-lg px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
    </div>
  );
}

export default function StationEditor({
  station,
  meta,
  wordLimit,
  consequenceLimit,
  onStationChange,
  previousStationText,
  previousStationTitle,
  onAddInventoryItem,
}: StationEditorProps) {
  const [hintExpanded, setHintExpanded] = useState(false);
  const [previousExpanded, setPreviousExpanded] = useState(false);

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
    onStationChange({ ...station, choices: [...station.choices, { label: "", consequence: "" }] });
  }

  function removeChoice(index: number) {
    if (station.choices.length <= meta.minChoices) return;
    onStationChange({ ...station, choices: station.choices.filter((_, i) => i !== index) });
  }

  const canAddChoice = choicesUnlocked && station.choices.length < meta.maxChoices;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-6" style={{ color: "var(--color-text)" }}>

      {/* ── Previous station context ── */}
      {previousStationText && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setPreviousExpanded((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
            style={{ background: "var(--color-bg-muted)" }}
          >
            <span className="text-xs font-semibold text-gray-500">
              ← {previousStationTitle ?? "Vorherige Station"} (zur Erinnerung)
            </span>
            <span className="text-xs text-gray-400">{previousExpanded ? "▲" : "▼"}</span>
          </button>
          {previousExpanded && (
            <div className="px-4 py-3 border-t border-gray-200">
              <p className="text-sm leading-relaxed text-gray-500 whitespace-pre-wrap">
                {previousStationText}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Station title ── */}
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
          Station {meta.id} von 6
        </p>
        <h2 className="text-2xl font-extrabold" style={{ color: "var(--color-text)" }}>
          {meta.title}
        </h2>
      </div>

      {/* ── Hint block ── */}
      <div className="rounded-xl border border-gray-200 bg-[var(--color-bg-muted)] px-4 py-3 text-sm text-gray-600">
        <p>{meta.hint}</p>
        {hintExpanded && <p className="mt-2 text-gray-500">{meta.expandedHint}</p>}
        <button
          type="button"
          onClick={() => setHintExpanded((v) => !v)}
          className="mt-2 text-xs font-semibold text-[var(--color-indigo)] hover:underline focus:outline-none"
        >
          {hintExpanded ? "Weniger ▲" : "Mehr Hilfe ▼"}
        </button>
      </div>

      {/* ── Main textarea ── */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label
            htmlFor={`station-text-${station.id}`}
            className="text-sm font-semibold text-gray-700"
          >
            Deine Geschichte
          </label>
          {onAddInventoryItem && (
            <InventoryQuickAdd onAdd={onAddInventoryItem} />
          )}
        </div>
        <AutoGrowTextarea
          id={`station-text-${station.id}`}
          value={station.text}
          onChange={updateText}
          placeholder="Schreibe hier deine Geschichte …"
          minRows={6}
        />
        <WordCounter count={wordCount} limit={wordLimit} />
      </div>

      {/* ── Word-limit hint ── */}
      {showWordHint && (
        <div
          className="rounded-xl px-4 py-3 text-sm font-medium animate-in fade-in duration-300"
          style={{ background: "var(--color-amber-light)", color: "#92400E" }}
        >
          Tipp: Arbeite auf eine Entscheidung hin!
        </div>
      )}

      {/* ── Choice section ── */}
      {hasChoiceSection && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
                Entscheidungen
              </h3>
              <div className="h-px flex-1" style={{ background: "linear-gradient(to right, var(--color-amber), transparent)" }} />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Am Ende dieses Abschnitts darf die Leserin wählen — schreib für jede Option, was dann passiert.
            </p>
          </div>

          {!choicesUnlocked && (
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-3 text-center text-sm text-gray-400">
              Schreib mindestens 60 Wörter, um Entscheidungen hinzuzufügen.
            </div>
          )}

          {choicesUnlocked && (
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
                  + Entscheidung hinzufügen
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
