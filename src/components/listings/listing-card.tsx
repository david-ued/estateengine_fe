'use client';

import { IconBath, IconBed, IconClock, IconRulerMeasure } from '@tabler/icons-react';
import Link from 'next/link';
import type { Dictionary } from '@/i18n/get-dictionary';
import { coverImageUrl } from '@/lib/media';
import type { Property } from '@/lib/types';

// PRD：專注展示上市 20-30 天內的新鮮物件 → 30 天內標示新上市
const FRESH_DAYS = 30;

function daysOnMarket(listedAt: string | null): number | null {
  if (!listedAt) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(listedAt).getTime()) / 86_400_000));
}

/** Airbnb 式卡片：大圖、資訊分層、特色標籤、房仲迷你卡 */
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
  const dom = daysOnMarket(property.listed_at);
  const agent = property.agent;

  // 特色標籤：頂級建材 / 優質學區
  const tags: string[] = [];
  if ((property.material_grade ?? 0) >= 4) tags.push(dict.listings.tagTopMaterial);
  if ((property.score_school ?? 0) >= 80) tags.push(dict.listings.tagTopSchool);

  return (
    <div className="fade-up group" style={{ animationDelay: `${index * 70}ms` }}>
      <Link href={`/${locale}/properties/${property.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100 shadow-sm transition-shadow duration-300 group-hover:shadow-xl dark:bg-neutral-900">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 遠端圖
            <img
              src={cover}
              alt={property.title}
              className="size-full object-cover transition duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex size-full items-center justify-center text-3xl text-neutral-300 dark:text-neutral-700"
            >
              🏠
            </div>
          )}
          {matchScore !== null && (
            <span className="absolute right-2.5 top-2.5 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-white shadow-md">
              {dict.weights.matchScore} {matchScore}
            </span>
          )}
          {dom !== null && dom <= FRESH_DAYS && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-white shadow-md">
              {dict.listings.newBadge}
            </span>
          )}
          {/* 上市天數（醒目標示） */}
          {dom !== null && (
            <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-neutral-800 shadow-sm backdrop-blur-sm">
              <IconClock size={13} />
              {dict.listings.daysBadge.replace('{days}', String(dom))}
            </span>
          )}
        </div>

        <div className="pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="truncate font-medium">{property.title}</h3>
            <span className="whitespace-nowrap font-semibold">
              ${Number(property.price).toLocaleString(locale)}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-neutral-500">
            {property.city}
            {property.district ? ` · ${property.district}` : ''}
          </p>
          <div className="mt-1.5 flex items-center gap-3 text-sm text-neutral-500">
            <span className="flex items-center gap-1">
              <IconBed size={15} /> {property.beds}
            </span>
            <span className="flex items-center gap-1">
              <IconBath size={15} /> {property.baths}
            </span>
            <span className="flex items-center gap-1">
              <IconRulerMeasure size={15} />
              {Number(property.area_sqft).toLocaleString(locale)} {dict.filters.sqft}
            </span>
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent-dark"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* 負責房仲迷你卡（點擊進房仲專頁） */}
      {agent && (
        <Link
          href={`/${locale}/agents/${agent.id}`}
          className="mt-2 flex items-center gap-2 rounded-lg px-1 py-1 text-sm text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-800 dark:hover:bg-neutral-900 dark:hover:text-neutral-200"
        >
          {agent.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 遠端圖
            <img
              src={agent.avatar_url}
              alt=""
              className="size-6 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-6 items-center justify-center rounded-full bg-neutral-200 text-xs dark:bg-neutral-700"
            >
              👤
            </span>
          )}
          <span className="truncate">
            {agent.display_name ?? agent.full_name}
            {agent.agency_name ? ` · ${agent.agency_name}` : ''}
          </span>
        </Link>
      )}
    </div>
  );
}
