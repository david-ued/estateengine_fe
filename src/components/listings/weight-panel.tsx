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
    <aside className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white/60 p-4 backdrop-blur-sm lg:sticky lg:top-24 lg:self-start dark:border-neutral-800 dark:bg-neutral-950/60">
      <div>
        <h2 className="font-semibold">{labels.title}</h2>
        <p className="mt-1 text-xs text-neutral-500">{labels.description}</p>
      </div>

      {/* Persona 範本一鍵套用 */}
      <div className="flex flex-wrap gap-2">
        {PERSONAS.map((persona) => (
          <button
            key={persona.code}
            type="button"
            onClick={() => onChange({ ...persona.weights })}
            className="rounded-full border border-neutral-300 px-3 py-1 text-xs transition hover:-translate-y-0.5 hover:bg-neutral-100 hover:shadow-sm dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            {personaLabels[persona.code]}
          </button>
        ))}
      </div>

      {/* 權重滑桿 */}
      <div className="flex flex-col gap-3">
        {SCORE_DIMENSIONS.map((dimension) => (
          <label key={dimension} className="flex flex-col gap-1 text-sm">
            <span className="flex justify-between">
              {labels[DIMENSION_LABEL_KEYS[dimension]]}
              <span className="font-mono text-neutral-500">
                {weights[dimension] ?? 0}%
              </span>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={weights[dimension] ?? 0}
              onChange={(e) =>
                onChange({ ...weights, [dimension]: Number(e.target.value) })
              }
              className="accent-neutral-900 dark:accent-white"
            />
          </label>
        ))}
      </div>
    </aside>
  );
}
