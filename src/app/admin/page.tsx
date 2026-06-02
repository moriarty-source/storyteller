"use client";

import { useState, useCallback } from "react";
import type { Story, WordLimits } from "@/types/story";
import { DEFAULT_WORD_LIMITS } from "@/types/story";
import AdminStoryRow from "@/components/AdminStoryRow";
import ConfigPanel from "@/components/ConfigPanel";

// ── Password Gate ──────────────────────────────────────────────────────────────

interface PasswordGateProps {
  onAuth: (password: string, stories: Story[], limits: WordLimits) => void;
}

function PasswordGate({ onAuth }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const [storiesRes, configRes] = await Promise.all([
        fetch("/api/admin/stories", { headers: { "x-admin-password": password } }),
        fetch("/api/admin/config", { headers: { "x-admin-password": password } }),
      ]);

      if (storiesRes.status === 401 || configRes.status === 401) {
        setError("Falsches Passwort");
        setLoading(false);
        return;
      }

      if (!storiesRes.ok || !configRes.ok) {
        throw new Error("Server-Fehler");
      }

      const stories = (await storiesRes.json()) as Story[];
      const configData = (await configRes.json()) as { wordLimits: WordLimits };

      onAuth(password, stories, configData.wordLimits);
    } catch {
      setError("Verbindungsfehler. Bitte erneut versuchen.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg-muted)] px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-xl font-black uppercase tracking-[0.2em] text-[var(--color-text)]">
            Admin
          </h1>
          <p className="mb-6 text-sm text-gray-400">Passwort eingeben</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="Passwort"
              autoComplete="current-password"
              autoFocus
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-medium focus:border-[var(--color-amber)] focus:outline-none transition-colors"
            />

            {error && (
              <p className="text-sm font-semibold text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full min-h-[48px] rounded-2xl px-6 py-3 text-sm font-bold text-white hover:brightness-105 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "var(--color-amber)" }}
            >
              {loading ? "Wird geprüft…" : "Einloggen"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

// ── Admin Dashboard ────────────────────────────────────────────────────────────

interface DashboardProps {
  password: string;
  initialStories: Story[];
  initialLimits: WordLimits;
}

function Dashboard({ password, initialStories, initialLimits }: DashboardProps) {
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [wordLimits, setWordLimits] = useState<WordLimits>(initialLimits);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const authHeaders = { "x-admin-password": password };

  const fetchStories = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch("/api/admin/stories", { headers: authHeaders });
      if (!res.ok) throw new Error("Fehler");
      const data = (await res.json()) as Story[];
      setStories(data);
    } catch {
      setRefreshError("Fehler beim Laden der Geschichten.");
    } finally {
      setRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password]);

  async function handleComplete(code: string) {
    try {
      const res = await fetch(`/api/admin/stories/${code}`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) throw new Error("Fehler");
      const updated = (await res.json()) as Story;
      setStories((prev) => prev.map((s) => (s.code === code ? updated : s)));
    } catch {
      alert(`Fehler beim Abschließen von ${code}`);
    }
  }

  async function handleDelete(code: string) {
    try {
      const res = await fetch(`/api/admin/stories/${code}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Fehler");
      setStories((prev) => prev.filter((s) => s.code !== code));
    } catch {
      alert(`Fehler beim Löschen von ${code}`);
    }
  }

  async function handleSaveLimits(limits: WordLimits) {
    const res = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ wordLimits: limits }),
    });
    if (!res.ok) throw new Error("Fehler beim Speichern");
    const data = (await res.json()) as { wordLimits: WordLimits };
    setWordLimits(data.wordLimits);
  }

    async function handlePasswordChange(newPassword: string) {
    try {
      const res = await fetch("/api/admin/password", {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) throw new Error("Passwort-Änderung fehlgeschlagen");
      alert("Passwort erfolgreich geändert");
    } catch {
      alert("Fehler beim Ändern des Passworts");
    }
  }

  const activeCount = stories.filter((s) => s.status === "active").length;
  const completedCount = stories.filter((s) => s.status === "completed").length;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-muted)" }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--color-text)]">
              Storytelling Workshop
            </h1>
            <span
              className="rounded-lg px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
              style={{ background: "var(--color-amber-light)", color: "var(--color-amber)" }}
            >
              Admin
            </span>
          </div>

          <button
            type="button"
            onClick={fetchStories}
            disabled={refreshing}
            className="rounded-xl border-2 border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-colors min-h-[36px] disabled:opacity-60"
          >
            {refreshing ? "…" : "↺ Aktualisieren"}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="mx-auto max-w-5xl px-4 py-6 flex flex-col gap-6">

        {/* Stats row */}
        <div className="flex gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-3 flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Aktiv
            </span>
            <span
              className="text-2xl font-black tabular-nums"
              style={{ color: "var(--color-amber)" }}
            >
              {activeCount}
            </span>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-3 flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Abgeschlossen
            </span>
            <span
              className="text-2xl font-black tabular-nums"
              style={{ color: "var(--color-indigo)" }}
            >
              {completedCount}
            </span>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-3 flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Gesamt
            </span>
            <span className="text-2xl font-black tabular-nums text-gray-700">
              {stories.length}
            </span>
          </div>
        </div>

        {/* Error */}
        {refreshError && (
          <p className="text-sm font-semibold text-red-600" role="alert">
            {refreshError}
          </p>
        )}

        {/* Stories table */}
        <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">
              Geschichten
            </h2>
          </div>

          {stories.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Noch keine Geschichten vorhanden.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-[var(--color-bg-muted)]">
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                      Code
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                      Figur
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                      Fortschritt
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                      Zuletzt aktiv
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stories.map((story) => (
                    <AdminStoryRow
                      key={story.code}
                      story={story}
                      onComplete={handleComplete}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Config panel */}
        <ConfigPanel limits={wordLimits} onSave={handleSaveLimits} onPasswordSave={handlePasswordChange} />

      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [auth, setAuth] = useState<{
    password: string;
    stories: Story[];
    limits: WordLimits;
  } | null>(null);

  if (!auth) {
    return (
      <PasswordGate
        onAuth={(password, stories, limits) => setAuth({ password, stories, limits })}
      />
    );
  }

  return (
    <Dashboard
      password={auth.password}
      initialStories={auth.stories}
      initialLimits={auth.limits}
    />
  );
}
