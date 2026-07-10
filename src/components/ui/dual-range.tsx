'use client';

/**
 * 雙向滑桿（價格 / 坪數區間用）：
 * 兩個原生 range 疊在同一軌道上，透過 CSS 只讓拇指可點。
 */
export function DualRange({
  min,
  max,
  step,
  low,
  high,
  onChange,
  format,
}: Readonly<{
  min: number;
  max: number;
  step: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
  format: (value: number) => string;
}>) {
  const lowPct = ((low - min) / (max - min)) * 100;
  const highPct = ((high - min) / (max - min)) * 100;

  return (
    <div>
      <div className="mb-1 flex justify-between font-mono text-xs text-neutral-600 dark:text-neutral-300">
        <span>{format(low)}</span>
        <span>{format(high)}</span>
      </div>
      <div className="dual-range relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-200 dark:bg-neutral-700" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand"
          style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={(e) => onChange(Math.min(Number(e.target.value), high - step), high)}
          aria-label="min"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={(e) => onChange(low, Math.max(Number(e.target.value), low + step))}
          aria-label="max"
        />
      </div>
    </div>
  );
}
