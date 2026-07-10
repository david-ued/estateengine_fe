'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { createClient } from '@/lib/supabase/client';

/**
 * 公開導覽列的登入狀態區塊。
 * 根 layout 必須保持靜態（不可用 cookies() / server Supabase），
 * 故登入偵測僅在瀏覽器端進行；SSR 與未解析前一律顯示登入按鈕。
 */
export function NavAuth({
  locale,
  labels,
}: Readonly<{
  locale: string;
  labels: Readonly<{
    signIn: string;
    signOut: string;
    agentDashboard: string;
    adminDashboard: string;
  }>;
}>) {
  const [account, setAccount] = useState<{
    id: string;
    role: string | null;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    // 使用者與角色一次解析，避免 signIn ↔ dashboard 之間多一段中間狀態
    async function resolve(id: string | null) {
      if (!id) {
        if (active) setAccount(null);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', id)
        .maybeSingle();
      if (active) setAccount({ id, role: data?.role ?? null });
    }

    supabase.auth.getUser().then(({ data }) => resolve(data.user?.id ?? null));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void resolve(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!account) {
    return (
      <Link
        href={`/${locale}/login`}
        className="press btn-primary rounded-full px-4 py-1.5"
      >
        {labels.signIn}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      {account.role === 'agent' && (
        <Link
          href={`/${locale}/agent`}
          className="whitespace-nowrap text-neutral-600 transition-colors hover:text-foreground dark:text-neutral-400"
        >
          {labels.agentDashboard}
        </Link>
      )}
      {account.role === 'super_admin' && (
        <Link
          href={`/${locale}/admin`}
          className="whitespace-nowrap text-neutral-600 transition-colors hover:text-foreground dark:text-neutral-400"
        >
          {labels.adminDashboard}
        </Link>
      )}
      <SignOutButton
        locale={locale}
        label={labels.signOut}
        className="press whitespace-nowrap rounded-full border border-neutral-300 px-4 py-1.5 text-sm transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
      />
    </div>
  );
}
