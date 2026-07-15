import type { ReactNode } from 'react';

export interface FeatureRow {
  label: string;
  value: ReactNode;
}

export interface FeatureGroup {
  heading: string;
  rows: FeatureRow[];
}

/**
 * Property Features 兩欄格（參考站樣式）：
 * 小節標題（全大寫寬字距）+ label 灰字 / value 深字的 dl 列。
 */
export function FeatureGrid({ groups }: Readonly<{ groups: FeatureGroup[] }>) {
  const visible = groups.filter((group) => group.rows.length > 0);
  if (visible.length === 0) return null;

  return (
    <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
      {visible.map((group) => (
        <section key={group.heading}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
            {group.heading}
          </h3>
          <dl className="mt-3 divide-y divide-neutral-100 dark:divide-neutral-800">
            {group.rows.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-6 py-2.5 text-sm"
              >
                <dt className="shrink-0 text-neutral-500">{row.label}</dt>
                <dd className="text-right font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
