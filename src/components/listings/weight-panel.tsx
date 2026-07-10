'use client';

import type { Dictionary } from '@/i18n/get-dictionary';
import { PERSONAS } from '@/lib/constants';
import { SCORE_DIMENSIONS, type ScoreDimension, type WeightMap } from '@/lib/scoring';

const DIMENSION_LABEL_KEYS: Record<ScoreDimension, keyof Dictionary['weights']> = {
  school: 'school',
  transit: 'transit',
  material: 'material',
  feng_shui: 'fengShui',
  environment: 'environment',
};

// 小白友善三段式：不重要 / 普通 / 很重要（取代 0-100 滑桿）
const LEVELS = [
  { key: 'levelLow', value: 0 },
  { key: 'levelMid', value: 20 },
  { key: 'levelHigh', value: 45 },
] as const;

function levelOf(weight: number): (typeof LEVELS)[number]['key'] {
  if (weight <= 0) return 'levelLow';
  if (weight <= 25) return 'levelMid';
  return 'levelHigh';
}

function sameWeights(a: WeightMap, b: WeightMap): boolean {
  return SCORE_DIMENSIONS.every((d) => (a[d] ?? 0) === (b[d] ?? 0));
}

export function WeightPanel({
  weights,
  onChange,
  labels,
  personaLabels,
}: Readonly<{
  weights: WeightMap;
  onChange: (weights: WeightMap) => void;
  labels: Dictionary['weights'];
  personaLabels: Dictionary['personas'];
}>) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mb-3">
        <h2 className="font-semibold">{labels.personaTitle}</h2>
        <p className="mt-0.5 text-xs text-neutral-500">{labels.personaHint}</p>
      </div>

      {/* Persona 卡片：一鍵套用（手機橫向滑動） */}
      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
        {PERSONAS.map((persona) => {
          const active = sameWeights(weights, persona.weights);
          return (
            <button
              key={persona.code}
              type="button"
              onClick={() => onChange({ ...persona.weights })}
              className={`flex min-w-[92px] snap-start flex-col items-center gap-1 rounded-xl border px-3 py-2.5 transition ${
                active
                  ? 'border-brand bg-brand/5 text-brand shadow-sm'
                  : 'border-neutral-200 text-neutral-600 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:text-neutral-300'
              }`}
            >
              <span className="text-2xl leading-none">{persona.icon}</span>
              <span className="whitespace-nowrap text-xs font-medium">
                {personaLabels[persona.code]}
              </span>
            </button>
          );
        })}
      </div>

      {/* 進階微調：預設收合，避免嚇到新手 */}
      <details className="mt-3 group">
        <summary className="cursor-pointer select-none text-sm text-neutral-500 transition hover:text-neutral-800 dark:hover:text-neutral-200">
          {labels.advanced}
          <span className="ml-1 inline-block transition-transform group-open:rotate-180">
            ⌄
          </span>
        </summary>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {SCORE_DIMENSIONS.map((dimension) => {
            const currentLevel = levelOf(weights[dimension] ?? 0);
            return (
              <div
                key={dimension}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-neutral-700 dark:text-neutral-300">
                  {labels[DIMENSION_LABEL_KEYS[dimension]]}
                </span>
                <div className="flex shrink-0 rounded-full border border-neutral-200 p-0.5 dark:border-neutral-700">
                  {LEVELS.map((level) => (
                    <button
                      key={level.key}
                      type="button"
                      onClick={() =>
                        onChange({ ...weights, [dimension]: level.value })
                      }
                      className={`rounded-full px-2.5 py-1 text-xs transition ${
                        currentLevel === level.key
                          ? 'bg-brand font-medium text-white'
                          : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                      }`}
                    >
                      {labels[level.key]}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </section>
  );
}
