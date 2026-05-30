"use client";

import { useState } from "react";

interface InventoryPanelProps {
  items: string[];
  onAddItem: (item: string) => void;
  onRemoveItem: (index: number) => void;
}

export default function InventoryPanel({
  items,
  onAddItem,
  onRemoveItem,
}: InventoryPanelProps) {
  const [adding, setAdding] = useState(false);
  const [inputValue, setInputValue] = useState("");

  function handleAdd() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onAddItem(trimmed);
    setInputValue("");
    setAdding(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    } else if (e.key === "Escape") {
      setAdding(false);
      setInputValue("");
    }
  }

  function handleCancel() {
    setAdding(false);
    setInputValue("");
  }

  return (
    <div
      className="rounded-xl border border-gray-100 bg-white shadow-sm px-4 py-3"
    >
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
        🎒 Rucksack
      </p>

      {items.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: "var(--color-amber-light)",
                color: "#92400E",
              }}
            >
              {item}
              <button
                type="button"
                onClick={() => onRemoveItem(i)}
                aria-label={`${item} entfernen`}
                className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-amber-700 hover:bg-amber-200 transition-colors duration-100 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {items.length === 0 && !adding && (
        <p className="mb-3 text-xs text-gray-400 italic">Noch keine Gegenstände</p>
      )}

      {adding ? (
        <div className="flex gap-2">
          <input
            type="text"
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Gegenstand…"
            className={[
              "flex-1 min-w-0 rounded-lg border-2 border-gray-200 bg-white px-3 py-1.5",
              "text-xs text-[var(--color-text)] placeholder-gray-400",
              "focus:border-[var(--color-amber)] focus:outline-none",
              "transition-colors duration-150",
            ].join(" ")}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inputValue.trim()}
            className="rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40 transition-opacity"
            style={{ background: "var(--color-amber)" }}
          >
            OK
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className={[
            "w-full rounded-lg border-2 border-dashed border-gray-200 px-3 py-2",
            "text-xs font-semibold text-gray-400",
            "hover:border-[var(--color-amber)] hover:text-[var(--color-amber)]",
            "transition-colors duration-150 min-h-[36px]",
          ].join(" ")}
        >
          + Gegenstand gefunden!
        </button>
      )}
    </div>
  );
}
