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
    <div className="rounded-2xl border-2 border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: "var(--color-amber-light)" }}
      >
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#92400E" }}>
          Entscheidung {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Entscheidung ${index + 1} entfernen`}
            className="flex h-7 w-7 items-center justify-center rounded-full text-amber-700 hover:bg-amber-200 transition-colors"
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Choice label — the option shown to the reader */}
        <div>
          <label
            htmlFor={`choice-label-${index}`}
            className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500"
          >
            Auswahlmöglichkeit
          </label>
          <p className="mb-1.5 text-xs text-gray-400">
            Was sieht die Leserin als Entscheidung? (kurz & klar)
          </p>
          <input
            id={`choice-label-${index}`}
            type="text"
            value={choice.label}
            onChange={(e) => onChange({ ...choice, label: e.target.value })}
            placeholder="z.B. Sie geht über die Brücke"
            className={[
              "w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5",
              "text-[var(--color-text)] placeholder-gray-400",
              "focus:border-[var(--color-amber)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/20",
              "transition-colors duration-150",
            ].join(" ")}
            style={{ fontSize: "1rem" }}
          />
        </div>

        {/* Visual arrow */}
        <div className="flex items-center gap-2 px-2">
          <div className="h-px flex-1" style={{ background: "var(--color-amber)", opacity: 0.4 }} />
          <span className="text-xs font-bold" style={{ color: "var(--color-amber)" }}>
            → dann passiert:
          </span>
          <div className="h-px flex-1" style={{ background: "var(--color-amber)", opacity: 0.4 }} />
        </div>

        {/* Consequence — what happens as a result */}
        <div>
          <label
            htmlFor={`choice-consequence-${index}`}
            className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500"
          >
            Konsequenz
          </label>
          <p className="mb-1.5 text-xs text-gray-400">
            Was passiert, wenn die Leserin diese Entscheidung trifft?
          </p>
          <AutoGrowTextarea
            id={`choice-consequence-${index}`}
            value={choice.consequence}
            onChange={(v) => onChange({ ...choice, consequence: v })}
            placeholder="z.B. Die Brücke knarzt bedrohlich unter Lenas Füßen..."
            minRows={2}
          />
          <WordCounter count={consequenceWordCount} limit={consequenceLimit} />
        </div>
      </div>
    </div>
  );
}
