"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CodeInput from "@/components/CodeInput";

export default function Home() {
  const router = useRouter();

  // ── New story state ──────────────────────────────────
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // ── Code input state ─────────────────────────────────
  const [codeChars, setCodeChars] = useState<string[]>(["", "", "", ""]);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  const fullCode = codeChars.join("");
  const codeComplete = fullCode.length === 4 && codeChars.every((c) => c !== "");

  // ── Handlers ─────────────────────────────────────────
  async function handleStart() {
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch("/api/stories", { method: "POST" });
      if (!res.ok) throw new Error("Server-Fehler");
      const data = (await res.json()) as { code: string };
      router.push(`/story/${data.code}`);
    } catch {
      setStartError("Fehler beim Erstellen der Geschichte. Bitte erneut versuchen.");
      setStarting(false);
    }
  }

  async function handleOpen() {
    if (!codeComplete) return;
    setOpening(true);
    setOpenError(null);
    try {
      const res = await fetch(`/api/stories/${fullCode}`);
      if (res.status === 404) {
        setOpenError("Geschichte nicht gefunden");
        setOpening(false);
        return;
      }
      if (!res.ok) throw new Error("Server-Fehler");
      const story = (await res.json()) as { status: string; code: string };
      if (story.status === "completed") {
        router.push(`/story/${story.code}/view`);
      } else {
        router.push(`/story/${story.code}`);
      }
    } catch {
      setOpenError("Fehler beim Öffnen der Geschichte. Bitte erneut versuchen.");
      setOpening(false);
    }
  }

  function handleCodeChange(chars: string[]) {
    setCodeChars(chars);
    setOpenError(null);
  }

  // ── Render ────────────────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] px-6 py-12">
      <div className="w-full max-w-sm flex flex-col items-center gap-10">

        {/* Title */}
        <div className="text-center select-none">
          <h1 className="text-4xl font-black tracking-widest uppercase text-[var(--color-text)]">
            Story Maker
          </h1>
          <p className="mt-2 text-sm tracking-wider text-gray-400 uppercase">
            Dein Schreibabenteuer
          </p>
        </div>

        {/* Primary CTA */}
        <div className="w-full flex flex-col items-center gap-3">
          <button
            onClick={handleStart}
            disabled={starting}
            className={[
              "w-full min-h-[56px] rounded-2xl px-6 py-4",
              "text-white font-bold text-lg tracking-wide",
              "bg-[var(--color-amber)]",
              "active:scale-[0.97] transition-transform duration-100",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-4 focus:ring-[var(--color-amber)]/40",
            ].join(" ")}
          >
            {starting ? "Wird erstellt…" : "Neue Geschichte starten"}
          </button>

          {startError && (
            <p className="text-sm text-red-600 text-center" role="alert">
              {startError}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-sm tracking-widest select-none">oder</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Code resume section */}
        <div className="w-full flex flex-col items-center gap-5">
          <p className="text-sm text-gray-500 tracking-wide">
            Code eingeben um fortzufahren
          </p>

          <CodeInput value={codeChars} onChange={handleCodeChange} />

          {openError && (
            <p className="text-sm text-red-600 text-center" role="alert">
              {openError}
            </p>
          )}

          <button
            onClick={handleOpen}
            disabled={!codeComplete || opening}
            className={[
              "w-full min-h-[56px] rounded-2xl px-6 py-4",
              "text-white font-bold text-lg tracking-wide",
              "bg-[var(--color-indigo)]",
              "active:scale-[0.97] transition-transform duration-100",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-4 focus:ring-[var(--color-indigo)]/40",
            ].join(" ")}
          >
            {opening ? "Wird geöffnet…" : "Öffnen"}
          </button>
        </div>

      </div>
    </main>
  );
}
