'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { btn, errorTextClass } from '@/components/ui/styles';
import { apiFetch } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

/** 收件匣單則訊息的「標為已讀 / 未讀」切換（成功後 refresh 讓 server 重新渲染） */
export function ReadToggle({
  messageId,
  isRead,
  labels,
  errorText,
}: Readonly<{
  messageId: string;
  isRead: boolean;
  labels: Readonly<{ markRead: string; markUnread: string }>;
  errorText: string;
}>) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setPending(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');

      await apiFetch(
        `/contact/${messageId}/read?value=${isRead ? 'false' : 'true'}`,
        { method: 'PATCH', token: session.access_token },
      );
      router.refresh();
    } catch {
      setError(errorText);
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1 sm:items-end">
      <button
        type="button"
        disabled={pending}
        onClick={toggle}
        className={btn.quiet}
      >
        {isRead ? labels.markUnread : labels.markRead}
      </button>
      {error && <span className={errorTextClass}>{error}</span>}
    </span>
  );
}
