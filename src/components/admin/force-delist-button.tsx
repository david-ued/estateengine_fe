'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export function ForceDelistButton({
  propertyId,
  label,
  confirmText,
}: Readonly<{ propertyId: string; label: string; confirmText: string }>) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!window.confirm(confirmText)) return;
    setPending(true);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setPending(false);
      return;
    }

    const res = await fetch(`${API_BASE_URL}/properties/${propertyId}/force-delist`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    setPending(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
    >
      {label}
    </button>
  );
}
