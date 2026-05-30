"use client";

import type { Story } from "@/types/story";
import { relativeTime } from "@/lib/relativeTime";

interface AdminStoryRowProps {
  story: Story;
  onComplete: (code: string) => void;
  onDelete: (code: string) => void;
}

export default function AdminStoryRow({ story, onComplete, onDelete }: AdminStoryRowProps) {
  const completedStations = story.stations.filter((s) => s.completed).length;
  const totalStations = 6;
  const progressPercent = (completedStations / totalStations) * 100;

  return (
    <tr className="border-b border-gray-100 hover:bg-[var(--color-bg-muted)] transition-colors">
      {/* Code */}
      <td className="px-4 py-3">
        <span
          className="inline-block rounded-lg px-3 py-1 font-mono text-base font-extrabold tracking-widest"
          style={{ background: "var(--color-amber-light)", color: "var(--color-text)" }}
        >
          {story.code}
        </span>
      </td>

      {/* Figur */}
      <td className="px-4 py-3 text-sm font-medium text-gray-700">
        {story.character?.name || "–"}
      </td>

      {/* Fortschritt */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div
              className="relative h-3 w-28 rounded-full overflow-hidden"
              style={{ background: "#E5E7EB" }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                style={{
                  width: `${progressPercent}%`,
                  background: progressPercent === 100 ? "var(--color-indigo)" : "var(--color-amber)",
                }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-600 tabular-nums">
              {completedStations}/{totalStations}
            </span>
          </div>
        </div>
      </td>

      {/* Zuletzt aktiv */}
      <td className="px-4 py-3 text-sm text-gray-500">
        {relativeTime(story.updatedAt)}
      </td>

      {/* Aktionen */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Open in new tab */}
          <a
            href={`/story/${story.code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-xl border-2 border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-colors min-h-[36px]"
            aria-label={`Geschichte ${story.code} öffnen`}
          >
            → Öffnen
          </a>

          {/* Complete or badge */}
          {story.status === "active" ? (
            <button
              type="button"
              onClick={() => onComplete(story.code)}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-white min-h-[36px] hover:brightness-105 active:scale-95 transition-all duration-150"
              style={{ background: "var(--color-indigo)" }}
            >
              ✓ Abschließen
            </button>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold"
              style={{ background: "var(--color-amber-light)", color: "var(--color-indigo)" }}
            >
              Abgeschlossen ✓
            </span>
          )}

          {/* Delete */}
          <button
            type="button"
            onClick={() => {
              if (confirm(`Geschichte ${story.code} wirklich löschen?`)) {
                onDelete(story.code);
              }
            }}
            className="inline-flex items-center rounded-xl border-2 border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:border-red-300 hover:text-red-700 transition-colors min-h-[36px]"
            aria-label={`Geschichte ${story.code} löschen`}
          >
            ✕
          </button>
        </div>
      </td>
    </tr>
  );
}
