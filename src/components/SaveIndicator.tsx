"use client";

interface SaveIndicatorProps {
  status: "saved" | "saving" | "error";
}

export default function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === "saving") {
    return (
      <span
        className="text-xs font-medium text-gray-400 animate-pulse"
        aria-live="polite"
        aria-label="Speichert..."
      >
        Speichert...
      </span>
    );
  }

  if (status === "error") {
    return (
      <span
        className="text-xs font-medium"
        style={{ color: "#EF4444" }}
        aria-live="assertive"
        aria-label="Fehler beim Speichern"
      >
        Fehler beim Speichern
      </span>
    );
  }

  // saved
  return (
    <span
      className="text-xs font-medium"
      style={{ color: "#10B981" }}
      aria-live="polite"
      aria-label="Gespeichert"
    >
      Gespeichert ✓
    </span>
  );
}
