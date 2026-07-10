'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { btn, errorTextClass } from '@/components/ui/styles';
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
  errorText,
}: Readonly<{
  propertyId: string;
  status: PropertyStatus;
  labels: Dictionary['agent']['actions'];
  errorText: string;
}>) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeStatus(to: PropertyStatus) {
    setPending(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');

      await apiFetch(`/properties/${propertyId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: to }),
        token: session.access_token,
      });
      router.refresh();
    } catch {
      setError(errorText);
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="flex flex-col items-end gap-1.5">
      <span className="flex flex-wrap justify-end gap-1.5">
        {TRANSITIONS[status].map(({ key, to }) => (
          <button
            key={key}
            type="button"
            disabled={pending}
            onClick={() => changeStatus(to)}
            className={key === 'delist' ? btn.danger : btn.quiet}
          >
            {labels[key]}
          </button>
        ))}
      </span>
      {error && <span className={errorTextClass}>{error}</span>}
    </span>
  );
}
