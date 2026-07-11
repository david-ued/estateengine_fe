'use client';

import { IconTrash } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { btn, errorTextClass } from '@/components/ui/styles';
import { ApiError, apiFetch } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

export function DeleteUserButton({
  userId,
  labels,
}: Readonly<{
  userId: string;
  labels: {
    delete: string;
    deleteConfirm: string;
    deleteBlocked: string;
    actionError: string;
  };
}>) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(labels.deleteConfirm)) return;
    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');

      await apiFetch(`/users/${userId}`, {
        method: 'DELETE',
        token: session.access_token,
      });
      router.refresh();
    } catch (err) {
      // 409：名下還有物件，需先處理
      setError(
        err instanceof ApiError && err.status === 409
          ? labels.deleteBlocked
          : labels.actionError,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={handleDelete}
        className={btn.danger}
        aria-label={labels.delete}
      >
        <IconTrash size={14} /> {labels.delete}
      </button>
      {error && <span className={`${errorTextClass} max-w-48 text-right`}>{error}</span>}
    </span>
  );
}
