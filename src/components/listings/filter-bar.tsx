'use client';

import { useRouter } from 'next/navigation';
import type { Dictionary } from '@/i18n/get-dictionary';
import { CITIES } from '@/lib/constants';

const inputClass =
  'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-white';

export interface ListingFilters {
  city?: string;
  minPrice?: string;
  maxPrice?: string;
  minSqft?: string;
  beds?: string;
  baths?: string;
}

export function FilterBar({
  locale,
  labels,
  defaults,
}: Readonly<{
  locale: string;
  labels: Dictionary['filters'];
  defaults: ListingFilters;
}>) {
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    for (const key of ['city', 'minPrice', 'maxPrice', 'minSqft', 'beds', 'baths']) {
      const value = form.get(key);
      if (typeof value === 'string' && value.trim() !== '') {
        params.set(key, value.trim());
      }
    }

    const query = params.toString();
    router.push(`/${locale}/properties${query ? `?${query}` : ''}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 p-4 sm:grid-cols-3 lg:grid-cols-7 dark:border-neutral-800"
    >
      <label className="flex flex-col gap-1 text-xs text-neutral-500">
        {labels.location}
        <select name="city" defaultValue={defaults.city ?? ''} className={inputClass}>
          <option value="">{labels.any}</option>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-neutral-500">
        {labels.price} ({labels.min})
        <input
          name="minPrice"
          type="number"
          min="0"
          defaultValue={defaults.minPrice ?? ''}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-neutral-500">
        {labels.price} ({labels.max})
        <input
          name="maxPrice"
          type="number"
          min="0"
          defaultValue={defaults.maxPrice ?? ''}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-neutral-500">
        {labels.sqft} ({labels.min})
        <input
          name="minSqft"
          type="number"
          min="0"
          defaultValue={defaults.minSqft ?? ''}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-neutral-500">
        {labels.beds} ({labels.min})
        <input
          name="beds"
          type="number"
          min="0"
          defaultValue={defaults.beds ?? ''}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-neutral-500">
        {labels.baths} ({labels.min})
        <input
          name="baths"
          type="number"
          min="0"
          defaultValue={defaults.baths ?? ''}
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        className="btn-primary self-end rounded-xl px-4 py-2 text-sm font-medium"
      >
        {labels.apply}
      </button>
    </form>
  );
}
