'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { selectClass } from '@/components/ui/styles';
import type { Dictionary } from '@/i18n/get-dictionary';

// 權重/符合度排序已退場（PIVOT.md）：僅保留最新上架 / 價格
const SORT_OPTIONS = ['newest', 'price_desc', 'price_asc'] as const;

type SortOption = (typeof SORT_OPTIONS)[number];

export function SortSelect({
  locale,
  labels,
}: Readonly<{
  locale: string;
  labels: Pick<
    Dictionary['listings'],
    'sortLabel' | 'sortNewest' | 'sortPriceDesc' | 'sortPriceAsc'
  >;
}>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get('sort');
  const value: SortOption = SORT_OPTIONS.includes(raw as SortOption)
    ? (raw as SortOption)
    : 'newest';

  const optionLabels: Record<SortOption, string> = {
    newest: labels.sortNewest,
    price_desc: labels.sortPriceDesc,
    price_asc: labels.sortPriceAsc,
  };

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (event.target.value === 'newest') params.delete('sort');
    else params.set('sort', event.target.value);
    params.delete('page');
    const query = params.toString();
    router.push(`/${locale}/search${query ? `?${query}` : ''}`);
  }

  return (
    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
      {labels.sortLabel}
      <select value={value} onChange={handleChange} className={selectClass}>
        {SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {optionLabels[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
