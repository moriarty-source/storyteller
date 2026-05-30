"use client";

interface WordCounterProps {
  count: number;
  limit: number;
}

export default function WordCounter({ count, limit }: WordCounterProps) {
  const percentage = limit > 0 ? Math.min((count / limit) * 100, 100) : 0;
  const isOver = count > limit;
  const isNearLimit = percentage >= 80;

  const barColor = isOver
    ? "var(--color-red, #EF4444)"
    : isNearLimit
      ? "var(--color-amber)"
      : "var(--color-indigo)";

  return (
    <div className="mt-1.5 space-y-1">
      <p className="text-right text-xs font-medium text-gray-500">
        <span
          style={
            isOver
              ? { color: "var(--color-red, #EF4444)", fontWeight: 700 }
              : isNearLimit
                ? { color: "var(--color-amber)", fontWeight: 600 }
                : {}
          }
        >
          {count}
        </span>{" "}
        / {limit} Wörter
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${percentage}%`,
            background: barColor,
          }}
        />
      </div>
    </div>
  );
}
