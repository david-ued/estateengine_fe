'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function SignOutButton({
  locale,
  label,
  className = 'rounded-lg border border-neutral-300 px-4 py-2 text-sm transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800',
}: Readonly<{ locale: string; label: string; className?: string }>) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return (
    <button type="button" onClick={handleSignOut} className={className}>
      {label}
    </button>
  );
}
