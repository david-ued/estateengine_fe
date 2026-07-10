'use client';

import {
  IconAdjustmentsHorizontal,
  IconCheck,
  IconChevronDown,
} from '@tabler/icons-react';
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
              <span className="whitespace-nowrap text-sm font-medium">
                {personaLabels[persona.code]}
              </span>
            </button>
          );
        })}
      </div>

      {/* 進階微調：預設收合；大按鈕 + 明顯選中態（高齡友善：≥48px 觸控、粗邊框、勾勾標記） */}
      <details className="group mt-4">
        <summary className="flex min-h-12 cursor-pointer select-none list-none items-center justify-center gap-2 rounded-xl border-2 border-neutral-300 px-4 py-3 text-base font-semibold text-neutral-800 transition hover:border-brand hover:bg-brand/5 hover:text-brand dark:border-neutral-600 dark:text-neutral-100 [&::-webkit-details-marker]:hidden">
          <IconAdjustmentsHorizontal size={20} />
          {labels.advanced}
          <IconChevronDown
            size={20}
            className="transition-transform group-open:rotate-180"
          />
        </summary>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SCORE_DIMENSIONS.map((dimension) => {
            const currentLevel = levelOf(weights[dimension] ?? 0);
            return (
              <div
                key={dimension}
                className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 dark:border-neutral-700 dark:bg-neutral-900/60"
              >
                <p className="mb-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {labels[DIMENSION_LABEL_KEYS[dimension]]}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {LEVELS.map((level) => {
                    const active = currentLevel === level.key;
                    return (
                      <button
                        key={level.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          onChange({ ...weights, [dimension]: level.value })
                        }
                        className={`flex min-h-12 items-center justify-center gap-1 rounded-lg border-2 px-1 text-center text-[15px] font-medium leading-tight transition ${
                          active
                            ? 'border-brand bg-brand text-white shadow-md'
                            : 'border-neutral-300 bg-white text-neutral-700 hover:border-brand/60 hover:bg-brand/5 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-200'
                        }`}
                      >
                        {active && <IconCheck size={17} stroke={3} className="shrink-0" />}
                        {labels[level.key]}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </section>
  );
}
