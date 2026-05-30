"use client";

import { useRef, useCallback } from "react";
import type { Choice } from "@/types/story";
import WordCounter from "@/components/WordCounter";
import { countWords } from "@/lib/wordCount";

interface ChoiceCardProps {
  index: number;
  choice: Choice;
  consequenceLimit: number;
  onChange: (choice: Choice) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  id,
  minRows = 2,
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

export default function ChoiceCard({
  index,
  choice,
  consequenceLimit,
  onChange,
  onRemove,
  canRemove,
}: ChoiceCardProps) {
  const consequenceWordCount = countWords(choice.consequence);

  return (
    <div className="rounded-2xl border border-gray-200 bg-[var(--color-bg-muted)] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500">
          Entscheidung {index + 1}
        </h4>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Entscheidung ${index + 1} entfernen`}
            className={[
              "flex h-8 w-8 items-center justify-center rounded-full",
              "text-gray-400 hover:bg-red-50 hover:text-red-500",
              "transition-colors duration-150",
            ].join(" ")}
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ×
            </span>
          </button>
        )}
      </div>

      {/* Choice label */}
      <div>
        <label
          htmlFor={`choice-label-${index}`}
          className="mb-1.5 block text-sm font-semibold text-gray-700"
        >
          Was tut dein Charakter?
        </label>
        <input
          id={`choice-label-${index}`}
          type="text"
          value={choice.label}
          onChange={(e) => onChange({ ...choice, label: e.target.value })}
          placeholder="Beschreibe die Entscheidung …"
          className={[
            "w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3",
            "text-[var(--color-text)] placeholder-gray-400",
            "focus:border-[var(--color-amber)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/20",
            "transition-colors duration-150",
          ].join(" ")}
          style={{ fontSize: "1rem" }}
        />
      </div>

      {/* Consequence */}
      <div>
        <label
          htmlFor={`choice-consequence-${index}`}
          className="mb-1.5 block text-sm font-semibold text-gray-700"
        >
          Was passiert dann?
        </label>
        <AutoGrowTextarea
          id={`choice-consequence-${index}`}
          value={choice.consequence}
          onChange={(v) => onChange({ ...choice, consequence: v })}
          placeholder="Beschreibe die Konsequenz …"
          minRows={2}
        />
        <WordCounter count={consequenceWordCount} limit={consequenceLimit} />
      </div>
    </div>
  );
}
