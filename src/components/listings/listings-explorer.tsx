'use client';

import { useEffect, useRef, useState } from 'react';
import type { Dictionary } from '@/i18n/get-dictionary';
import { toScoreCard } from '@/lib/media';
import { calcMatchScore, type WeightMap } from '@/lib/scoring';
import { createClient } from '@/lib/supabase/client';
import type { Property } from '@/lib/types';
import { ListingCard } from './listing-card';
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
  dict,
}: Readonly<{
  locale: string;
  properties: Property[];
  dict: {
    filters: Dictionary['filters'];
    weights: Dictionary['weights'];
    personas: Dictionary['personas'];
    listings: Dictionary['listings'];
  };
}>) {
  const [weights, setWeights] = useState<WeightMap>(DEFAULT_WEIGHTS);
  const remoteProfileId = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 未登入：localStorage；登入者：讀取/覆寫 buyer_weight_profiles
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setWeights(JSON.parse(saved) as WeightMap);
    } catch {
      // ignore malformed storage
    }

    let cancelled = false;
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

  const scored = properties
    .map((property) => ({
      property,
      score: calcMatchScore(toScoreCard(property), weights),
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      <WeightPanel
        weights={weights}
        onChange={handleWeightsChange}
        labels={dict.weights}
        personaLabels={dict.personas}
      />
      <div>
        <p className="mb-3 text-xs text-neutral-500">{dict.listings.sortedByMatch}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
    </div>
  );
}
