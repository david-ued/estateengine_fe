'use client';

import { useState } from 'react';
import { btn, errorTextClass, inputClass, successTextClass } from '@/components/ui/styles';
import type { Dictionary } from '@/i18n/get-dictionary';
import { createClient } from '@/lib/supabase/client';

export function SignupForm({
  labels,
}: Readonly<{ labels: Dictionary['auth'] }>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    // 註冊一律建立 buyer；升級為 agent 由 Admin 後台審核（見 TODO：users module）
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(labels.signUpError);
      setPending(false);
      return;
    }

    setSuccess(true);
    setPending(false);
  }

  if (success) {
    return <p className={successTextClass}>{labels.signUpSuccess}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        {labels.fullName}
        <input
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputClass}
        />
      </label>
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
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </label>
      {error && <p className={errorTextClass}>{error}</p>}
      <button type="submit" disabled={pending} className={`${btn.primary} w-full`}>
        {pending ? labels.signingUp : labels.signUp}
      </button>
    </form>
  );
}
