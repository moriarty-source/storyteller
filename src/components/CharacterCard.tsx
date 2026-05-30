"use client";

import type { Character } from "@/types/story";

interface CharacterCardProps {
  character: Character;
}

export default function CharacterCard({ character }: CharacterCardProps) {
  return (
    <div
      className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden"
      style={{ borderTopColor: "var(--color-indigo)", borderTopWidth: "3px" }}
    >
      <div className="px-4 py-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
          Figur
        </p>
        {character.name ? (
          <p className="text-base font-extrabold truncate" style={{ color: "var(--color-text)" }}>
            {character.name}
          </p>
        ) : (
          <p className="text-base font-extrabold text-gray-300 italic">Kein Name</p>
        )}

        <div className="mt-3 space-y-1.5">
          {character.strength && (
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-xs font-bold uppercase tracking-wider text-gray-400 w-16">
                Stärke
              </span>
              <span
                className="text-xs font-semibold rounded-full px-2 py-0.5"
                style={{
                  background: "var(--color-amber-light)",
                  color: "#92400E",
                }}
              >
                {character.strength}
              </span>
            </div>
          )}

          {character.weakness && (
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-xs font-bold uppercase tracking-wider text-gray-400 w-16">
                Schwäche
              </span>
              <span className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                {character.weakness}
              </span>
            </div>
          )}

          {character.goal && (
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-xs font-bold uppercase tracking-wider text-gray-400 w-16">
                Ziel
              </span>
              <span className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                {character.goal}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
