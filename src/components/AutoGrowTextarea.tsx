"use client";

import { useRef, useCallback } from "react";

interface AutoGrowTextareaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
  minRows?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  id,
  minRows = 4,
  className,
  style,
}: AutoGrowTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const el = e.currentTarget;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
      onChange(el.value);
    },
    [onChange]
  );

  return (
    <textarea
      ref={ref}
      id={id}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      rows={minRows}
      className={
        className ??
        [
          "w-full resize-none rounded-xl border-2 border-gray-200 bg-white px-4 py-3",
          "text-[var(--color-text)] placeholder-gray-400",
          "focus:border-[var(--color-amber)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/20",
          "transition-colors duration-150 leading-relaxed overflow-hidden",
        ].join(" ")
      }
      style={style ?? { fontSize: "1rem", minHeight: `${minRows * 1.75 + 1.5}rem` }}
    />
  );
}
