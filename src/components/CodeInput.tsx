"use client";

import { useRef, ClipboardEvent, KeyboardEvent, ChangeEvent } from "react";

interface CodeInputProps {
  value: string[]; // array of 4 chars
  onChange: (value: string[]) => void;
}

export default function CodeInput({ value, onChange }: CodeInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  function handleChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.toUpperCase();
    // Take only the last typed character (in case browser inserts more)
    const char = raw.slice(-1);

    const next = [...value];
    next[index] = char;
    onChange(next);

    // Advance to next field if a char was entered
    if (char && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (value[index]) {
        // Clear current field
        const next = [...value];
        next[index] = "";
        onChange(next);
      } else if (index > 0) {
        // Move to previous field and clear it
        const next = [...value];
        next[index - 1] = "";
        onChange(next);
        inputRefs.current[index - 1]?.focus();
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && index < 3) {
      inputRefs.current[index + 1]?.focus();
      e.preventDefault();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const chars = pasted.slice(0, 4).split("");
    const next = ["", "", "", ""];
    chars.forEach((c, i) => {
      next[i] = c;
    });
    onChange(next);
    // Focus the field after the last pasted char (or last field)
    const focusIndex = Math.min(chars.length, 3);
    inputRefs.current[focusIndex]?.focus();
  }

  function handleFocus(index: number) {
    // Select existing content so typing replaces it
    inputRefs.current[index]?.select();
  }

  return (
    <div className="flex gap-3 justify-center" aria-label="4-stelliger Code">
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          maxLength={2} // allow 2 so handleChange can take the last char on replacement
          value={value[i]}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(i)}
          aria-label={`Code-Zeichen ${i + 1}`}
          className={[
            "w-14 h-16 text-center text-2xl font-bold uppercase",
            "border-2 rounded-xl outline-none",
            "text-[var(--color-text)]",
            "transition-colors duration-150",
            value[i]
              ? "border-[var(--color-indigo)] bg-white"
              : "border-gray-300 bg-white",
            "focus:border-[var(--color-indigo)] focus:ring-2 focus:ring-[var(--color-indigo)]/20",
            "active:border-[var(--color-indigo)]",
            // Prevent iOS font-size zoom — must be at least 16px
            "text-[1.5rem]",
          ].join(" ")}
          style={{ fontSize: "1.5rem" }} // enforce 24px so iOS doesn't zoom
        />
      ))}
    </div>
  );
}
