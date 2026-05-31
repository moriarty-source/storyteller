"use client";

import { useState } from "react";
import type { Story } from "@/types/story";
import { STATIONS } from "@/types/story";

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

interface StoryViewProps {
  story: Story;
}

export default function StoryView({ story }: StoryViewProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      // Dynamically import to avoid SSR issues
      const { pdf } = await import("@react-pdf/renderer");
      const { StoryDocument } = await import("@/components/StoryDocument");
      const React = (await import("react")).default;

      // Cast through unknown to satisfy react-pdf's DocumentProps constraint
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const element = React.createElement(StoryDocument, { story }) as any;
      const blob = await pdf(element).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${story.character.name}-abenteuer.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF-Export fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-bg-muted)" }}
    >
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4 shadow-sm"
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h1
            className="text-sm font-black uppercase tracking-[0.3em]"
            style={{ color: "var(--color-text)" }}
          >
            Story Maker
          </h1>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 leading-none mb-0.5">
              Dein persönlicher Story-Code
            </span>
            <span
              className="font-mono text-lg font-extrabold tracking-widest leading-none"
              style={{ color: "var(--color-amber)" }}
            >
              {story.code}
            </span>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="mx-auto max-w-2xl px-4 py-8 pb-28">

        {/* Title */}
        <div className="mb-8 text-center">
          <div className="mb-1 text-4xl">🌟</div>
          <h2
            className="text-3xl font-extrabold tracking-tight"
            style={{ color: "var(--color-text)" }}
          >
            {story.character.name}s Abenteuer
          </h2>
          <p className="mt-1 text-sm text-gray-400 tracking-widest uppercase font-mono">
            Code: {story.code}
          </p>
        </div>

        {/* Divider */}
        <hr className="my-6 border-gray-200" />

        {/* ── World ── */}
        <section className="mb-8">
          <h3
            className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-gray-400"
          >
            Die Welt
          </h3>
          <p className="text-base leading-relaxed text-gray-800 mb-3">
            {story.world.description}
          </p>
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">Das größte Problem:</span>{" "}
            {story.world.problem}
          </p>
        </section>

        {/* ── Character ── */}
        <section className="mb-8">
          <h3
            className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-gray-400"
          >
            Unsere Heldin / Unser Held
          </h3>
          <div className="space-y-1.5 text-sm">
            <CharacterRow label="Name" value={story.character.name} />
            <CharacterRow label="Stärke" value={story.character.strength} />
            <CharacterRow label="Ziel" value={story.character.goal} />
            <CharacterRow label="Schwäche" value={story.character.weakness} />
            {story.character.secret && (
              <CharacterRow label="Geheimnis" value={story.character.secret} />
            )}
          </div>
          {story.inventory.length > 0 && (
            <p className="mt-3 text-sm text-gray-600">
              <span className="mr-1.5">🎒</span>
              <span className="font-semibold text-gray-700">Inventar:</span>{" "}
              {story.inventory.join(", ")}
            </p>
          )}
        </section>

        {/* Divider */}
        <hr className="my-6 border-gray-200" />

        {/* ── Stations ── */}
        <div className="space-y-10">
          {story.stations.map((station, idx) => {
            const meta = STATIONS.find((m) => m.id === station.id);
            const roman = ROMAN[idx] ?? String(station.id);
            const title = meta?.title ?? `Station ${station.id}`;

            return (
              <section key={station.id}>
                <h3
                  className="mb-3 text-base font-extrabold tracking-wide"
                  style={{ color: "var(--color-text)" }}
                >
                  <span
                    className="mr-2 font-mono text-sm"
                    style={{ color: "var(--color-amber)" }}
                  >
                    {roman}.
                  </span>
                  {title.toUpperCase()}
                </h3>

                {station.text && (
                  <p className="mb-4 text-base leading-relaxed text-gray-800">
                    {station.text}
                  </p>
                )}

                {station.choices.length > 0 && (
                  <div className="space-y-4 pl-4">
                    {station.choices.map((choice, ci) => (
                      <div key={ci}>
                        <p className="font-semibold text-sm text-gray-800">
                          <span
                            className="mr-2"
                            style={{ color: "var(--color-amber)" }}
                            aria-hidden="true"
                          >
                            ▸
                          </span>
                          {choice.label}
                        </p>
                        {choice.consequence && (
                          <p className="mt-1 pl-5 text-sm leading-relaxed text-gray-500">
                            {choice.consequence}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Divider */}
        <hr className="my-8 border-gray-200" />

      </main>

      {/* ── Fixed PDF Export Bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 py-3 shadow-md"
      >
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className={[
              "w-full rounded-2xl px-6 py-3 text-sm font-bold text-white",
              "shadow-sm transition-all duration-150",
              exporting
                ? "opacity-60 cursor-not-allowed"
                : "hover:brightness-105 active:scale-[0.98]",
            ].join(" ")}
            style={{ background: "var(--color-amber)" }}
          >
            {exporting ? "Wird exportiert …" : "📄 Als PDF exportieren"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CharacterRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-24 shrink-0 font-semibold text-gray-700">{label}:</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}
