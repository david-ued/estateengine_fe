'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { btn, errorTextClass } from '@/components/ui/styles';
import { apiFetch } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

export function RoleActions({
  userId,
  role,
  labels,
}: Readonly<{
  userId: string;
  role: 'buyer' | 'agent';
  labels: { makeAgent: string; makeBuyer: string; actionError: string };
}>) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setRole(next: 'buyer' | 'agent') {
    setPending(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');

      await apiFetch(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: next }),
        token: session.access_token,
      });
      router.refresh();
    } catch {
      setError(labels.actionError);
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="flex flex-col items-end gap-1.5">
      {role === 'buyer' ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => setRole('agent')}
          className={btn.quiet}
        >
          {labels.makeAgent}
        </button>
      ) : (
        // 降級為破壞性操作：移除房仲權限
        <button
          type="button"
          disabled={pending}
          onClick={() => setRole('buyer')}
          className={btn.danger}
        >
          {labels.makeBuyer}
        </button>
      )}
      {error && <span className={errorTextClass}>{error}</span>}
    </span>
  );
}
