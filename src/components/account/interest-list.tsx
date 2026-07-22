'use client';

import Link from 'next/link';
import { useState } from 'react';
import { badgeClass, btn, errorTextClass } from '@/components/ui/styles';
import { apiFetch } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { InterestDecision, InterestProperty } from '@/lib/types';

export interface InterestRowData {
  property: InterestProperty;
  decision: InterestDecision;
  act_fast: boolean;
  decided_at: string | null;
}

export interface InterestListLabels {
  decision: Record<InterestDecision, string>;
  lockIn: string;
  walkAway: string;
  reset: string;
  actFastBadge: string;
  unavailable: string;
  error: string;
}

/** 決策徽章配色：鎖定金、跳過灰、考慮中細框 */
const DECISION_BADGE: Record<InterestDecision, string> = {
  considering: 'border border-neutral-300 text-neutral-500 dark:border-neutral-700',
  locked_in: 'bg-ink text-gold-soft',
  walked_away: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-900',
};

/**
 * 買家「物件表態」清單：對收藏的物件 lock-in（請 agent 洽談）/ walk away。
 * Act Fast 為 agent 端設定，這裡以徽章告知買家「已在為你洽談」。
 */
export function InterestList({
  locale,
  rows: initialRows,
  labels,
}: Readonly<{
  locale: string;
  rows: InterestRowData[];
  labels: InterestListLabels;
}>) {
  const [rows, setRows] = useState(initialRows);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  async function setDecision(propertyId: string, decision: InterestDecision) {
    setPendingId(propertyId);
    setErrorId(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');

      await apiFetch(`/prospects/me/interests/${propertyId}`, {
        method: 'PUT',
        token: session.access_token,
        body: JSON.stringify({ decision }),
      });
      setRows((prev) =>
        prev.map((row) =>
          row.property.id === propertyId
            ? { ...row, decision, decided_at: new Date().toISOString() }
            : row,
        ),
      );
    } catch {
      setErrorId(propertyId);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <ul className="mt-6 flex flex-col divide-y divide-neutral-200 border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
      {rows.map((row) => {
        const { property } = row;
        const pending = pendingId === property.id;
        return (
          <li
            key={property.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/${locale}/properties/${property.id}`}
                  className="truncate font-medium transition-colors hover:text-gold"
                >
                  {property.title}
                </Link>
                {property.status !== 'published' && (
                  <span
                    className={`${badgeClass} border border-neutral-300 text-neutral-500 dark:border-neutral-700`}
                  >
                    {labels.unavailable}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-neutral-500">
                {property.city}
                {property.district ? ` · ${property.district}` : ''} · $
                {Number(property.price).toLocaleString(locale)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={cn(badgeClass, DECISION_BADGE[row.decision])}>
                  {labels.decision[row.decision]}
                </span>
                {row.act_fast && (
                  <span className={`${badgeClass} border border-gold text-gold`}>
                    {labels.actFastBadge}
                  </span>
                )}
              </div>
              {errorId === property.id && (
                <p className={`${errorTextClass} mt-2`}>{labels.error}</p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {row.decision !== 'locked_in' && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setDecision(property.id, 'locked_in')}
                  className={cn(btn.quiet, 'border-gold text-gold')}
                >
                  {labels.lockIn}
                </button>
              )}
              {row.decision !== 'walked_away' && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setDecision(property.id, 'walked_away')}
                  className={btn.quiet}
                >
                  {labels.walkAway}
                </button>
              )}
              {row.decision !== 'considering' && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setDecision(property.id, 'considering')}
                  className={btn.quiet}
                >
                  {labels.reset}
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
