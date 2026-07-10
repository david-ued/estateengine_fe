'use client';

import { IconArrowsSort } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Dictionary } from '@/i18n/get-dictionary';

const SORT_OPTIONS = ['recommended', 'newest', 'price_desc', 'price_asc'] as const;

const LABEL_KEYS: Record<(typeof SORT_OPTIONS)[number], keyof Dictionary['listings']> = {
  recommended: 'sortRecommended',
  newest: 'sortNewest',
  price_desc: 'sortPriceDesc',
  price_asc: 'sortPriceAsc',
};

export function SortSelect({
  locale,
  labels,
}: Readonly<{ locale: string; labels: Dictionary['listings'] }>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = searchParams.get('sort') ?? 'recommended';

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (event.target.value === 'recommended') params.delete('sort');
    else params.set('sort', event.target.value);
    params.delete('page');
    router.push(`/${locale}/properties?${params.toString()}`);
  }

  return (
    <label className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-300">
      <IconArrowsSort size={16} className="text-neutral-400" />
      <select
        value={value}
        onChange={handleChange}
        className="rounded-lg border border-neutral-300 bg-transparent px-2 py-1.5 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {labels[LABEL_KEYS[option]]}
          </option>
        ))}
      </select>
    </label>
  );
}
