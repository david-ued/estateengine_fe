'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Dictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import type { PropertyStatus } from '@/lib/types';

type ActionKey = keyof Dictionary['agent']['actions'];

// 各狀態允許的下一步操作
const TRANSITIONS: Record<PropertyStatus, { key: ActionKey; to: PropertyStatus }[]> = {
  draft: [{ key: 'publish', to: 'published' }],
  published: [
    { key: 'hide', to: 'hidden' },
    { key: 'delist', to: 'delisted' },
    { key: 'sold', to: 'sold' },
  ],
  hidden: [
    { key: 'publish', to: 'published' },
    { key: 'delist', to: 'delisted' },
  ],
  delisted: [{ key: 'publish', to: 'published' }],
  sold: [],
};

export function StatusActions({
  propertyId,
  status,
  labels,
}: Readonly<{
  propertyId: string;
  status: PropertyStatus;
  labels: Dictionary['agent']['actions'];
}>) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function changeStatus(to: PropertyStatus) {
    setPending(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      await apiFetch(`/properties/${propertyId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: to }),
        token: session.access_token,
      });
      router.refresh();
    } catch {
      // 操作失敗維持原狀態，重新整理由使用者重試
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="flex flex-wrap justify-end gap-1.5">
      {TRANSITIONS[status].map(({ key, to }) => (
        <button
          key={key}
          type="button"
          disabled={pending}
          onClick={() => changeStatus(to)}
          className="rounded-md border border-neutral-300 px-2 py-1 text-xs transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          {labels[key]}
        </button>
      ))}
    </span>
  );
}
