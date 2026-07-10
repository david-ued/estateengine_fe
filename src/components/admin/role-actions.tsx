'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

export function RoleActions({
  userId,
  role,
  labels,
}: Readonly<{
  userId: string;
  role: 'buyer' | 'agent';
  labels: { makeAgent: string; makeBuyer: string };
}>) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function setRole(next: 'buyer' | 'agent') {
    setPending(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      await apiFetch(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: next }),
        token: session.access_token,
      });
      router.refresh();
    } catch {
      // 失敗維持原角色
    } finally {
      setPending(false);
    }
  }

  return role === 'buyer' ? (
    <button
      type="button"
      disabled={pending}
      onClick={() => setRole('agent')}
      className="rounded-md bg-neutral-900 px-2.5 py-1 text-xs text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
    >
      {labels.makeAgent}
    </button>
  ) : (
    <button
      type="button"
      disabled={pending}
      onClick={() => setRole('buyer')}
      className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
    >
      {labels.makeBuyer}
    </button>
  );
}
