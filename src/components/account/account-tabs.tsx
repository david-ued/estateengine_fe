'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/** 買家帳號區的水平子導覽（收藏/搜尋 ↔ 帳號設定），金色底線標示所在頁。 */
export function AccountTabs({
  locale,
  labels,
}: Readonly<{
  locale: string;
  labels: Readonly<{ saved: string; settings: string }>;
}>) {
  const pathname = usePathname();
  const tabs = [
    { href: `/${locale}/account`, label: labels.saved },
    { href: `/${locale}/account/settings`, label: labels.settings },
  ];

  return (
    <nav className="mt-8 flex gap-6 border-b border-neutral-200 dark:border-neutral-800">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              '-mb-px border-b-2 px-1 pb-3 text-xs font-semibold uppercase tracking-[0.14em] transition-colors',
              isActive
                ? 'border-gold text-foreground'
                : 'border-transparent text-neutral-400 hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
