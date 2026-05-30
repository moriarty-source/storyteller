"use client";

import type { Station } from "@/types/story";

interface StationProgressProps {
  stations: Station[];
  currentStation: number; // 0 = character sheet, 1-6 = stations
  onStationClick: (id: number) => void;
}

interface ProgressItem {
  id: number;
  label: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isClickable: boolean;
}

export default function StationProgress({
  stations,
  currentStation,
  onStationClick,
}: StationProgressProps) {
  // Build a list: station 0 (Figur) + stations 1–6
  const items: ProgressItem[] = [
    {
      id: 0,
      label: "Figur",
      isCompleted: currentStation > 0,
      isCurrent: currentStation === 0,
      isClickable: currentStation >= 0,
    },
    ...stations.map((s) => ({
      id: s.id,
      label: `${s.id}`,
      isCompleted: s.completed,
      isCurrent: currentStation === s.id,
      isClickable: s.completed || currentStation === s.id,
    })),
  ];

  return (
    <nav
      className="flex flex-col items-center gap-2 py-4"
      aria-label="Stations-Fortschritt"
    >
      {items.map((item, i) => {
        const symbol = item.isCurrent ? "◉" : item.isCompleted ? "●" : "○";
        const isActive = item.isCurrent;
        const isDone = item.isCompleted;

        return (
          <div key={item.id} className="flex flex-col items-center">
            {/* Connector line above (not for first item) */}
            {i > 0 && (
              <div
                className="w-px mb-1"
                style={{
                  height: "12px",
                  background: items[i - 1].isCompleted || items[i - 1].isCurrent
                    ? "var(--color-indigo)"
                    : "#E5E7EB",
                }}
              />
            )}

            <button
              type="button"
              onClick={() => item.isClickable && onStationClick(item.id)}
              disabled={!item.isClickable}
              title={item.id === 0 ? "Charakter-Bogen" : `Station ${item.id}`}
              aria-label={item.id === 0 ? "Charakter-Bogen" : `Station ${item.id}`}
              aria-current={isActive ? "step" : undefined}
              className={[
                "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5",
                "transition-all duration-150",
                item.isClickable
                  ? "cursor-pointer hover:bg-gray-100"
                  : "cursor-default",
              ].join(" ")}
            >
              <span
                className="text-lg leading-none"
                style={{
                  color: isActive
                    ? "var(--color-indigo)"
                    : isDone
                    ? "var(--color-indigo)"
                    : "#D1D5DB",
                  fontWeight: isActive ? 700 : 400,
                }}
                aria-hidden="true"
              >
                {symbol}
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{
                  color: isActive
                    ? "var(--color-indigo)"
                    : isDone
                    ? "#6B7280"
                    : "#D1D5DB",
                }}
              >
                {item.label}
              </span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
