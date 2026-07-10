'use client';

import { useState } from 'react';
import type { Dictionary } from '@/i18n/get-dictionary';
import type { Property } from '@/lib/types';
import { ListingCard } from './listing-card';
import { ListingsMap } from './listings-map';
import { SortSelect } from './sort-select';

/** 列表 + 地圖分屏（篩選與 Persona 檔位由左側 FilterSidebar / 彈窗負責） */
export function ListingsExplorer({
  locale,
  properties,
  dict,
}: Readonly<{
  locale: string;
  properties: Property[];
  dict: {
    filters: Dictionary['filters'];
    listings: Dictionary['listings'];
  };
}>) {
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* 桌機：左列表右地圖（Airbnb 式分屏）；手機：列表 + 浮動地圖切換 */}
      <div className="xl:grid xl:grid-cols-[1fr_minmax(340px,44%)] xl:items-start xl:gap-6">
        <div>
          <div className="mb-3 flex items-center justify-end">
            <SortSelect locale={locale} labels={dict.listings} />
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2">
            {properties.map((property, index) => (
              <ListingCard
                key={property.id}
                locale={locale}
                property={property}
                index={index}
                dict={{
                  filters: dict.filters,
                  listings: dict.listings,
                }}
              />
            ))}
          </div>
        </div>

        <div className="hidden xl:block">
          <div className="sticky top-24 h-[calc(100vh-7.5rem)] overflow-hidden rounded-2xl border border-neutral-200 shadow-sm dark:border-neutral-800">
            <ListingsMap locale={locale} properties={properties} />
          </div>
        </div>
      </div>

      {/* 手機浮動切換鈕 */}
      <button
        type="button"
        onClick={() => setShowMap(true)}
        className="press fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-xl xl:hidden dark:bg-white dark:text-neutral-900"
      >
        <span aria-hidden="true">🗺 </span>
        {dict.listings.mapView}
      </button>

      {/* 手機全螢幕地圖 */}
      {showMap && (
        <div className="fixed inset-0 z-[60] bg-background xl:hidden">
          <ListingsMap locale={locale} properties={properties} />
          <button
            type="button"
            onClick={() => setShowMap(false)}
            className="press absolute bottom-6 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-xl dark:bg-white dark:text-neutral-900"
          >
            <span aria-hidden="true">✕ </span>
            {dict.listings.listView}
          </button>
        </div>
      )}
    </div>
  );
}
