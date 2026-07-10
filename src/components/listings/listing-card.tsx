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

/** Airbnb 式卡片：無框、圖片大圓角、文字直接落在背景上 */
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
      className="fade-up group block"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100 shadow-sm transition-shadow duration-300 group-hover:shadow-xl dark:bg-neutral-900">
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
          <span className="absolute right-2.5 top-2.5 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-white shadow-md">
            {dict.weights.matchScore} {matchScore}
          </span>
        )}
        {fresh !== null && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-white shadow-md">
            {dict.listings.newBadge}
          </span>
        )}
      </div>
      <div className="pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate font-medium">{property.title}</h3>
          <span className="whitespace-nowrap font-semibold">
            ${Number(property.price).toLocaleString()}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-neutral-500">
          {property.city}
          {property.district ? ` · ${property.district}` : ''}
        </p>
        <p className="mt-0.5 text-sm text-neutral-500">
          {Number(property.area_sqft).toLocaleString()} {dict.filters.sqft} ·{' '}
          {property.beds} {dict.filters.beds} / {property.baths} {dict.filters.baths}
        </p>
      </div>
    </Link>
  );
}
