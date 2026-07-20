'use client';

import { IconBath, IconBed, IconRulerMeasure } from '@tabler/icons-react';
import Link from 'next/link';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import type { Dictionary } from '@/i18n/get-dictionary';
import { coverImageUrl } from '@/lib/media';
import type { Property } from '@/lib/types';

// PRD：專注展示上市 20-30 天內的新鮮物件 → 30 天內標示新上市
const FRESH_DAYS = 30;

function daysOnMarket(listedAt: string | null): number | null {
  if (!listedAt) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(listedAt).getTime()) / 86_400_000));
}

/** The BRAND 式卡片：狀態徽章 + 愛心、粗體價格、beds/baths/sqft 統計列、編號與刊登者 */
export function ListingCard({
  locale,
  property,
  dict,
  index = 0,
}: Readonly<{
  locale: string;
  property: Property;
  dict: {
    filters: Dictionary['filters'];
    listings: Dictionary['listings'];
    favorite: Dictionary['favorite'];
  };
  index?: number;
}>) {
  const cover = coverImageUrl(property);
  const dom = daysOnMarket(property.listed_at);
  const agent = property.agent;
  const isFresh = dom !== null && dom <= FRESH_DAYS;
  const isPresale = property.is_presale === true;

  // 特色標籤：頂級建材 / 優質學區（獨家數據差異化）
  const tags: string[] = [];
  if ((property.material_grade ?? 0) >= 4) tags.push(dict.listings.tagTopMaterial);
  if ((property.score_school ?? 0) >= 80) tags.push(dict.listings.tagTopSchool);

  return (
    <div
      className="fade-up group border border-neutral-200 bg-white transition-shadow duration-300 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-950"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="relative">
        <FavoriteButton
          propertyId={property.id}
          locale={locale}
          labels={dict.favorite}
        />
        <Link
          href={`/${locale}/properties/${property.id}`}
          className="block"
          tabIndex={-1}
          aria-hidden
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-900">
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
            {/* 徽章優先序：預售屋 > 新上市 > 銷售中 */}
            <span
              className={`absolute left-3 top-3 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${
                isPresale
                  ? 'bg-ink text-gold-soft'
                  : isFresh
                    ? 'bg-gold text-white'
                    : 'bg-emerald-800 text-white'
              }`}
            >
              {isPresale
                ? dict.listings.presaleBadge
                : isFresh
                  ? dict.listings.newBadge
                  : dict.listings.activeBadge}
            </span>
            {dom !== null && (
              <span className="absolute bottom-3 left-3 bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {dict.listings.daysBadge.replace('{days}', String(dom))}
              </span>
            )}
          </div>
        </Link>
      </div>

      <Link
        href={`/${locale}/properties/${property.id}`}
        className="block p-4"
      >
        <p className="text-xl font-semibold tracking-tight">
          ${Number(property.price).toLocaleString(locale)}
        </p>

        <div className="mt-2 flex items-center gap-4 border-y border-neutral-100 py-2 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">
            <IconBed size={16} aria-hidden /> {property.beds}{' '}
            {dict.filters.beds}
          </span>
          <span className="flex items-center gap-1.5">
            <IconBath size={16} aria-hidden /> {property.baths}{' '}
            {dict.filters.baths}
          </span>
          <span className="flex items-center gap-1.5">
            <IconRulerMeasure size={16} aria-hidden />
            {Number(property.area_sqft).toLocaleString(locale)} SqFt
          </span>
        </div>

        <h3 className="mt-2.5 truncate font-medium">{property.title}</h3>
        <p className="mt-0.5 truncate text-sm text-neutral-500">
          {property.address ? `${property.address}, ` : ''}
          {property.city}
          {property.district ? ` · ${property.district}` : ''}
        </p>

        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-neutral-400">
          <span className="uppercase tracking-[0.08em]">
            {dict.listings.listingNo}
            {property.id.slice(0, 8).toUpperCase()}
            {property.property_type ? ` · ${property.property_type}` : ''}
          </span>
        </div>
        {agent && (
          <p className="mt-1.5 truncate text-xs text-neutral-400">
            {dict.listings.courtesyOf.replace(
              '{name}',
              agent.display_name ?? agent.full_name ?? '',
            )}
          </p>
        )}
      </Link>
    </div>
  );
}
