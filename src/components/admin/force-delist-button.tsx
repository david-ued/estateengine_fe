'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { btn, errorTextClass } from '@/components/ui/styles';
import { createClient } from '@/lib/supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export function ForceDelistButton({
  propertyId,
  label,
  confirmText,
  errorText,
}: Readonly<{
  propertyId: string;
  label: string;
  confirmText: string;
  errorText: string;
}>) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!window.confirm(confirmText)) return;
    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');

      const res = await fetch(
        `${API_BASE_URL}/properties/${propertyId}/force-delist`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      );
      if (!res.ok) throw new Error(`force-delist failed: ${res.status}`);
      router.refresh();
    } catch {
      setError(errorText);
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={btn.danger}
      >
        {label}
      </button>
      {error && <span className={errorTextClass}>{error}</span>}
    </span>
  );
}
