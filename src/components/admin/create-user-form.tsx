'use client';

import { IconUserPlus } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  btn,
  cardClass,
  errorTextClass,
  inputClass,
  selectClass,
} from '@/components/ui/styles';
import { apiFetch } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

const ROLES = ['buyer', 'agent', 'super_admin'] as const;

/** Admin 直接建立用戶（email 立即可登入，不寄驗證信） */
export function CreateUserForm({
  labels,
}: Readonly<{
  labels: {
    createUser: string;
    creating: string;
    email: string;
    password: string;
    fullName: string;
    role: string;
    roleLabels: Record<(typeof ROLES)[number], string>;
    actionError: string;
  };
}>) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');

      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify({
          email: String(data.get('email') ?? ''),
          password: String(data.get('password') ?? ''),
          fullName: String(data.get('fullName') ?? '') || undefined,
          role: String(data.get('role') ?? 'buyer'),
        }),
        token: session.access_token,
      });

      form.reset();
      router.refresh();
    } catch {
      setError(labels.actionError);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${cardClass} mb-6`}>
      <h3 className="mb-3 flex items-center gap-1.5 font-semibold">
        <IconUserPlus size={18} className="text-brand" /> {labels.createUser}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          {labels.email}
          <input name="email" type="email" required className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {labels.password}
          <input
            name="password"
            type="text"
            required
            minLength={8}
            autoComplete="off"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {labels.fullName}
          <input name="fullName" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {labels.role}
          <select name="role" defaultValue="buyer" className={selectClass}>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {labels.roleLabels[role]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className={`mt-2 ${errorTextClass}`}>{error}</p>}
      <div className="mt-4 flex justify-end">
        <button type="submit" disabled={pending} className={btn.primary}>
          {pending ? labels.creating : labels.createUser}
        </button>
      </div>
    </form>
  );
}
