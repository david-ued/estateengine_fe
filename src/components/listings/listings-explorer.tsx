'use client';

import { IconLayoutGrid, IconMap } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Dictionary } from '@/i18n/get-dictionary';
import type { Property } from '@/lib/types';
import { ListingCard } from './listing-card';
import { ListingsMap } from './listings-map';
import { SortSelect } from './sort-select';

/** List / Map 切換鈕（窄版用；寬版兩者並列不需切換） */
const viewBtn = (active: boolean) =>
  `press inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
    active
      ? 'bg-ink text-white'
      : 'bg-white text-neutral-600 hover:text-gold dark:bg-neutral-950 dark:text-neutral-300'
  }`;

/** xl（1280px）以上採分割視圖：地圖只在寬版掛載，避免 Leaflet 在隱藏容器內初始化 */
function useIsWide() {
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1280px)');
    const update = () => setWide(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return wide;
}

/**
 * Search 頁內容區（篩選列由頁面上方的 FilterBar 負責）：
 * 工具列 = 結果數 + 排序（窄版多一組 List/Map 切換）；
 * 寬版（xl+）= 卡片列表（左）+ sticky 地圖（右）同時呈現；
 * 窄版 = List/Map 切換：卡片格 + 分頁 或 全幅地圖。
 */
export function ListingsExplorer({
  locale,
  properties,
  total,
  pagination,
  dict,
}: Readonly<{
  locale: string;
  properties: Property[];
  total: number;
  pagination: {
    page: number;
    totalPages: number;
    prevHref: string | null;
    nextHref: string | null;
  };
  dict: {
    filters: Dictionary['filters'];
    listings: Dictionary['listings'];
    favorite: Dictionary['favorite'];
    search: Pick<Dictionary['search'], 'results'>;
  };
}>) {
  const [view, setView] = useState<'list' | 'map'>('list');
  const wide = useIsWide();

  const cardDict = {
    filters: dict.filters,
    listings: dict.listings,
    favorite: dict.favorite,
  };

  const cards = (columns: string) =>
    properties.length === 0 ? (
      <p className="py-20 text-center text-neutral-500">{dict.listings.noResults}</p>
    ) : (
      <div className={`grid gap-x-5 gap-y-8 ${columns}`}>
        {properties.map((property, index) => (
          <ListingCard
            key={property.id}
            locale={locale}
            property={property}
            index={index}
            dict={cardDict}
          />
        ))}
      </div>
    );

  const pager = pagination.totalPages > 1 && (
    <nav className="flex items-center justify-center gap-5 py-2 text-xs font-semibold uppercase tracking-[0.14em]">
      {pagination.prevHref && (
        <Link href={pagination.prevHref} className="transition-colors hover:text-gold">
          ← {dict.listings.prev}
        </Link>
      )}
      <span className="font-normal normal-case tracking-normal text-neutral-500">
        {pagination.page} / {pagination.totalPages}
      </span>
      {pagination.nextHref && (
        <Link href={pagination.nextHref} className="transition-colors hover:text-gold">
          {dict.listings.next} →
        </Link>
      )}
    </nav>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* 工具列：List/Map 切換（僅窄版）+ 結果數 + 排序 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div
          role="group"
          aria-label={`${dict.listings.listView} / ${dict.listings.mapView}`}
          className="flex divide-x divide-neutral-300 border border-neutral-300 xl:hidden dark:divide-neutral-700 dark:border-neutral-700"
        >
          <button
            type="button"
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
            className={viewBtn(view === 'list')}
          >
            <IconLayoutGrid size={15} aria-hidden />
            {dict.listings.listView}
          </button>
          <button
            type="button"
            aria-pressed={view === 'map'}
            onClick={() => setView('map')}
            className={viewBtn(view === 'map')}
          >
            <IconMap size={15} aria-hidden />
            {dict.listings.mapView}
          </button>
        </div>

        <span className="text-sm text-neutral-500">
          {dict.search.results.replace('{n}', total.toLocaleString(locale))}
        </span>

        <div className="ml-auto">
          <SortSelect locale={locale} labels={dict.listings} />
        </div>
      </div>

      {wide ? (
        /* 寬版分割視圖：卡片（左）+ sticky 地圖（右）。
           top/height 對齊 nav（60px）+ 篩選列（64px）的 sticky 疊層 */
        <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start gap-5">
          <div className="flex flex-col gap-8">
            {cards('grid-cols-2')}
            {pager}
          </div>
          <div className="sticky top-[132px] h-[calc(100vh-152px)] min-h-96 overflow-hidden border border-neutral-200 dark:border-neutral-800">
            <ListingsMap locale={locale} properties={properties} />
          </div>
        </div>
      ) : view === 'map' ? (
        <div className="h-[min(72vh,48rem)] min-h-96 overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <ListingsMap locale={locale} properties={properties} />
        </div>
      ) : (
        <>
          {cards('grid-cols-1 md:grid-cols-2')}
          {pager}
        </>
      )}
    </div>
  );
}
