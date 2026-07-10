'use client';

import Link from 'next/link';
import type { Dictionary } from '@/i18n/get-dictionary';
import { coverImageUrl } from '@/lib/media';
import type { Property } from '@/lib/types';

// PRD：專注展示上市 20-30 天內的新鮮物件 → 30 天內標示新上市
const FRESH_DAYS = 30;

function freshDays(listedAt: string | null): number | null {
  if (!listedAt) return null;
  const days = Math.floor((Date.now() - new Date(listedAt).getTime()) / 86_400_000);
  return days <= FRESH_DAYS ? days : null;
}

export function ListingCard({
  locale,
  property,
  matchScore,
  dict,
  index = 0,
}: Readonly<{
  locale: string;
  property: Property;
  matchScore: number | null;
  dict: {
    filters: Dictionary['filters'];
    weights: Dictionary['weights'];
    listings: Dictionary['listings'];
  };
  index?: number;
}>) {
  const cover = coverImageUrl(property);
  const fresh = freshDays(property.listed_at);

  return (
    <Link
      href={`/${locale}/properties/${property.id}`}
      className="card-lift fade-up group overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 遠端圖，avoid next/image remotePatterns 設定
          <img
            src={cover}
            alt={property.title}
            className="size-full object-cover transition duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-3xl text-neutral-300 dark:text-neutral-700">
            🏠
          </div>
        )}
        {matchScore !== null && (
          <span className="absolute right-2 top-2 rounded-full bg-neutral-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {dict.weights.matchScore} {matchScore}
          </span>
        )}
        {fresh !== null && (
          <span className="absolute left-2 top-2 rounded-full bg-emerald-600/90 px-2.5 py-1 text-xs font-semibold text-white">
            {dict.listings.newBadge}
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate font-semibold">{property.title}</h3>
          <span className="whitespace-nowrap font-mono text-sm">
            ${Number(property.price).toLocaleString()}
          </span>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          {property.city}
          {property.district ? ` · ${property.district}` : ''}
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          {Number(property.area_sqft).toLocaleString()} {dict.filters.sqft} ·{' '}
          {property.beds} {dict.filters.beds} / {property.baths} {dict.filters.baths}
        </p>
      </div>
    </Link>
  );
}
