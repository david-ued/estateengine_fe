'use client';

import Link from 'next/link';
import { useState } from 'react';
import { btn, cardClass, errorTextClass } from '@/components/ui/styles';
import type { Dictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import type { SavedSearch } from '@/lib/types';

/** 不列入摘要 chips 的技術性參數（仍會帶進「套用」的 query string） */
const HIDDEN_CHIP_KEYS = new Set(['sort', 'page', 'pageSize']);

/** 以篩選字典把 params 轉成人話 chips；未知 key 以原樣顯示 */
function chipText(
  key: string,
  value: string,
  filters: Dictionary['filters'],
): string {
  switch (key) {
    case 'city':
      return `${filters.location}: ${value}`;
    case 'minPrice':
      return `${filters.price} ${filters.min}: ${value}`;
    case 'maxPrice':
      return `${filters.price} ${filters.max}: ${value}`;
    case 'minSqft':
      return `${filters.sqft} ${filters.min}: ${value}`;
    case 'maxSqft':
      return `${filters.sqft} ${filters.max}: ${value}`;
    case 'beds':
      return `${value}+ ${filters.beds}`;
    case 'baths':
      return `${value}+ ${filters.baths}`;
    case 'propertyType':
      return `${filters.propertyType}: ${value}`;
    case 'minSchool':
      return `${filters.schoolRank}: ${value}+`;
    case 'minBuilder':
      return `${filters.builderQuality}: ${value}+`;
    case 'minMaterial':
      return `${filters.materialGrade}: ${value}+`;
    case 'orientation':
      return `${filters.fengShui}: ${value}`;
    case 'amenities':
      return `${filters.amenities}: ${value}`;
    default:
      return `${key}: ${value}`;
  }
}

/** 儲存的搜尋：名稱 + 日期 + 條件 chips + 套用 / 刪除 */
export function SavedSearchList({
  locale,
  items,
  labels,
  deleteLabel,
  filters,
}: Readonly<{
  locale: string;
  items: SavedSearch[];
  labels: Dictionary['account'];
  deleteLabel: string;
  filters: Dictionary['filters'];
}>) {
  const [list, setList] = useState(items);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function applyHref(search: SavedSearch): string {
    const query = new URLSearchParams(search.params).toString();
    return `/${locale}/search${query ? `?${query}` : ''}`;
  }

  async function handleDelete(id: string) {
    // 破壞性操作需二次確認（規格要求 confirm）
    if (!window.confirm(labels.deleteConfirm)) return;

    setPendingId(id);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');

      await apiFetch(`/saved-searches/${id}`, {
        method: 'DELETE',
        token: session.access_token,
      });
      setList((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setError(labels.actionError);
    } finally {
      setPendingId(null);
    }
  }

  if (list.length === 0) {
    return (
      <p className="mt-6 border border-neutral-200 px-6 py-16 text-center text-neutral-500 dark:border-neutral-800">
        {labels.savedSearchesEmpty}
      </p>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      {error && <p className={errorTextClass}>{error}</p>}
      {list.map((search) => {
        const chips = Object.entries(search.params).filter(
          ([key, value]) => !HIDDEN_CHIP_KEYS.has(key) && value !== '',
        );
        return (
          <article
            key={search.id}
            className={`${cardClass} flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between`}
          >
            <div className="min-w-0">
              <h3 className="font-medium">{search.name}</h3>
              <p className="mt-0.5 text-xs uppercase tracking-[0.08em] text-neutral-400">
                {labels.savedOn}{' '}
                {new Date(search.created_at).toLocaleDateString(locale)}
              </p>
              {chips.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {chips.map(([key, value]) => (
                    <span
                      key={key}
                      className="border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
                    >
                      {chipText(key, value, filters)}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link href={applyHref(search)} className={btn.quiet}>
                {labels.applySearch}
              </Link>
              <button
                type="button"
                disabled={pendingId === search.id}
                onClick={() => handleDelete(search.id)}
                className={btn.danger}
              >
                {deleteLabel}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
