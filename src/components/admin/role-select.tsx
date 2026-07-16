'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { errorTextClass, selectClass } from '@/components/ui/styles';
import { apiFetch } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

const ROLES = ['buyer', 'agent'] as const;
type Role = (typeof ROLES)[number];

/** Admin 使用者角色下拉：可設定 buyer / agent（本人帳號停用，避免鎖死後台） */
export function RoleSelect({
  userId,
  role,
  disabled = false,
  labels,
}: Readonly<{
  userId: string;
  role: Role;
  disabled?: boolean;
  labels: { roleLabels: Record<Role, string>; actionError: string };
}>) {
  const router = useRouter();
  const [value, setValue] = useState<Role>(role);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as Role;
    if (next === value) return;

    const previous = value;
    setValue(next);
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
      setValue(previous);
      setError(labels.actionError);
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled || pending}
        className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {ROLES.map((option) => (
          <option key={option} value={option}>
            {labels.roleLabels[option]}
          </option>
        ))}
      </select>
      {error && <span className={errorTextClass}>{error}</span>}
    </span>
  );
}
