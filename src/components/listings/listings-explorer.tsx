'use client';

import { useEffect, useRef, useState } from 'react';
import type { Dictionary } from '@/i18n/get-dictionary';
import { toScoreCard } from '@/lib/media';
import { calcMatchScore, type WeightMap } from '@/lib/scoring';
import { createClient } from '@/lib/supabase/client';
import type { Property } from '@/lib/types';
import { ListingCard } from './listing-card';
import { ListingsMap } from './listings-map';
import { SortSelect } from './sort-select';
import { WeightPanel } from './weight-panel';

const STORAGE_KEY = 'estateengine.weights';

const DEFAULT_WEIGHTS: WeightMap = {
  school: 20,
  transit: 20,
  material: 20,
  feng_shui: 20,
  environment: 20,
};

export function ListingsExplorer({
  locale,
  properties,
  sort,
  dict,
}: Readonly<{
  locale: string;
  properties: Property[];
  sort?: string;
  dict: {
    filters: Dictionary['filters'];
    weights: Dictionary['weights'];
    personas: Dictionary['personas'];
    listings: Dictionary['listings'];
  };
}>) {
  const [weights, setWeights] = useState<WeightMap>(DEFAULT_WEIGHTS);
  const [showMap, setShowMap] = useState(false);
  const remoteProfileId = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 未登入：localStorage；登入者：讀取/覆寫 buyer_weight_profiles
  useEffect(() => {
    let cancelled = false;

    // 延後到 microtask 讀取，避免 effect 內同步 setState（react-hooks/set-state-in-effect）
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) setWeights(JSON.parse(saved) as WeightMap);
      } catch {
        // ignore malformed storage
      }
    });
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const { data } = await supabase
          .from('buyer_weight_profiles')
          .select('id, weights')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle<{ id: string; weights: WeightMap }>();

        if (data && !cancelled) {
          remoteProfileId.current = data.id;
          setWeights(data.weights);
        }
      } catch {
        // DB 不可用時維持 localStorage 值
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function persistRemote(next: WeightMap) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        if (remoteProfileId.current) {
          await supabase
            .from('buyer_weight_profiles')
            .update({ weights: next })
            .eq('id', remoteProfileId.current);
        } else {
          const { data } = await supabase
            .from('buyer_weight_profiles')
            .insert({ user_id: user.id, weights: next })
            .select('id')
            .single<{ id: string }>();
          if (data) remoteProfileId.current = data.id;
        }
      } catch {
        // 儲存失敗不影響前端體驗
      }
    }, 800);
  }

  function handleWeightsChange(next: WeightMap) {
    setWeights(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable（私密模式等）
    }
    persistRemote(next);
  }

  // 系統推薦（預設）＝依買家權重符合度排序；其他排序沿用後端順序
  const isRecommended = !sort || sort === 'recommended';
  const scored = properties.map((property) => ({
    property,
    score: calcMatchScore(toScoreCard(property), weights),
  }));
  if (isRecommended) scored.sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col gap-4">
      <WeightPanel
        weights={weights}
        onChange={handleWeightsChange}
        labels={dict.weights}
        personaLabels={dict.personas}
      />

      {/* 桌機：左列表右地圖（Airbnb 式分屏）；手機：列表 + 浮動地圖切換 */}
      <div className="lg:grid lg:grid-cols-[1fr_minmax(360px,42%)] lg:items-start lg:gap-6">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs text-neutral-500">
              {isRecommended ? dict.listings.sortedByMatch : ''}
            </p>
            <SortSelect locale={locale} labels={dict.listings} />
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2">
            {scored.map(({ property, score }, index) => (
              <ListingCard
                key={property.id}
                locale={locale}
                property={property}
                matchScore={score}
                index={index}
                dict={{
                  filters: dict.filters,
                  weights: dict.weights,
                  listings: dict.listings,
                }}
              />
            ))}
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24 h-[calc(100vh-7.5rem)] overflow-hidden rounded-2xl border border-neutral-200 shadow-sm dark:border-neutral-800">
            <ListingsMap locale={locale} properties={properties} />
          </div>
        </div>
      </div>

      {/* 手機浮動切換鈕 */}
      <button
        type="button"
        onClick={() => setShowMap(true)}
        className="press fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-xl lg:hidden dark:bg-white dark:text-neutral-900"
      >
        <span aria-hidden="true">🗺 </span>
        {dict.listings.mapView}
      </button>

      {/* 手機全螢幕地圖 */}
      {showMap && (
        <div className="fixed inset-0 z-[60] bg-background lg:hidden">
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
