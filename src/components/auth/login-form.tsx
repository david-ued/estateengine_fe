'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { btn, errorTextClass, inputClass } from '@/components/ui/styles';
import type { Dictionary } from '@/i18n/get-dictionary';
import { createClient } from '@/lib/supabase/client';

export function LoginForm({
  locale,
  labels,
  next,
}: Readonly<{ locale: string; labels: Dictionary['auth']; next?: string }>) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      setError(labels.signInError);
      setPending(false);
      return;
    }

    // 依角色導向（雙角色，PIVOT.md）：agent → 後台、buyer → 首頁
    // buyer 帶安全的站內 next（如獨家數據 gating CTA）時導回原頁
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    const safeNext = next?.startsWith('/') && !next.startsWith('//') ? next : null;
    const destination =
      profile?.role === 'agent' ? `/${locale}/agent` : (safeNext ?? `/${locale}`);

    router.push(destination);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        {labels.email}
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {labels.password}
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </label>
      {error && <p className={errorTextClass}>{error}</p>}
      <button type="submit" disabled={pending} className={`${btn.primary} w-full`}>
        {pending ? labels.signingIn : labels.signIn}
      </button>
    </form>
  );
}
