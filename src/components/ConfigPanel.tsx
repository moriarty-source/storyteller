"use client";

import { useState } from "react";
import type { WordLimits } from "@/types/story";

interface ConfigPanelProps {
  limits: WordLimits;
  onSave: (limits: WordLimits) => void;
  onPasswordSave: (newPassword: string) => Promise<void>;
}

const STATION_LABELS: { key: keyof WordLimits; label: string }[] = [
  { key: "station1", label: "Station 1 (Ruf zum Abenteuer)" },
  { key: "station2", label: "Station 2 (Weigerung / Zögern)" },
  { key: "station3", label: "Station 3 (Mentor / Hilfe)" },
  { key: "station4", label: "Station 4 (Erste Prüfung)" },
  { key: "station5", label: "Station 5 (Höhepunkt)" },
  { key: "station6", label: "Station 6 (Rückkehr)" },
  { key: "consequence", label: "Konsequenz (je Auswahl)" },
];

export default function ConfigPanel({ limits, onSave, onPasswordSave }: ConfigPanelProps) {
  const [local, setLocal] = useState<WordLimits>(limits);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  // Sync when parent passes new limits
  if (JSON.stringify(local) !== JSON.stringify(limits) && !saving) {
    // Only update if limits externally changed (e.g. after refresh)
    // Simple approach; for production consider useEffect
    setLocal(limits);
  }

  function handleChange(key: keyof WordLimits, value: string) {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      setLocal((prev) => ({ ...prev, [key]: num }));
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await onSave(local);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handlePasswordSave() {
    if (!newPassword) return;
    setPwSaving(true);
    setPwSaved(false);
    try {
      await onPasswordSave(newPassword);
      setPwSaved(true);
      setNewPassword("");
    } catch {
      // simple error handling – UI could be extended
    } finally {
      setPwSaving(false);
      setTimeout(() => setPwSaved(false), 2000);
    }
  }

  return (
    <section
      className="rounded-2xl border border-gray-200 bg-white p-6"
      aria-labelledby="config-panel-title"
    >
      <h2
        id="config-panel-title"
        className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-gray-500"
      >
        Wort-Limits anpassen
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {STATION_LABELS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <label htmlFor={`limit-${key}`} className="flex-1 text-sm font-medium text-gray-700">
              {label}
            </label>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                id={`limit-${key}`}
                type="number"
                min={10}
                max={1000}
                step={10}
                value={local[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-20 rounded-xl border-2 border-gray-200 px-2 py-1.5 text-center text-sm font-bold tabular-nums focus:border-[var(--color-amber)] focus:outline-none transition-colors"
              />
              <span className="text-xs text-gray-400">Wörter</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <input
          type="password"
          placeholder="Neues Admin-Passwort"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="rounded-xl border-2 border-gray-200 px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={handlePasswordSave}
          disabled={pwSaving || !newPassword}
          className="rounded-2xl px-4 py-2 text-sm font-bold text-white"
          style={{ background: "var(--color-amber)" }}
        >
          {pwSaving ? "Wird gespeichert…" : "Passwort ändern"}
        </button>
        {pwSaved && (
          <span className="text-sm font-semibold text-green-600">✓ Passwort gesetzt</span>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl px-6 py-2.5 text-sm font-bold text-white min-h-[44px] hover:brightness-105 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "var(--color-amber)" }}
        >
          {saving ? "Wird gespeichert…" : "Speichern & Anwenden"}
        </button>
        {saved && (
          <span className="text-sm font-semibold text-green-600" role="status">
            ✓ Gespeichert
          </span>
        )}
      </div>
    </section>
  );
}
