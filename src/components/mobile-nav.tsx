'use client';

import { IconMenu2, IconX } from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NavAuth } from '@/components/auth/nav-auth';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { NavLinks } from '@/components/nav-links';
import type { Locale } from '@/i18n/config';

type NavLink = Readonly<{ href: string; label: string }>;

/**
 * 手機版導覽（<md 顯示）：漢堡按鈕 + 下拉面板。
 * 面板重用桌機版的 NavLinks / LocaleSwitcher / NavAuth，維持單一資料來源。
 * 面板以 absolute 錨定於 sticky <nav>（top-full），不需寫死高度像素。
 */
export function MobileNav({
  locale,
  links,
  localeLabel,
  authLabels,
  menuLabel,
  closeLabel,
}: Readonly<{
  locale: Locale;
  links: readonly NavLink[];
  localeLabel: string;
  authLabels: Readonly<{
    signIn: string;
    signOut: string;
    agentDashboard: string;
    favorites: string;
  }>;
  menuLabel: string;
  closeLabel: string;
}>) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 導航到新頁面即關閉：以「前一個 pathname」在 render 期間比對，
  // 取代 effect + setState（React 建議做法，亦避開 set-state-in-effect 規則）
  const [seenPathname, setSeenPathname] = useState(pathname);
  if (pathname !== seenPathname) {
    setSeenPathname(pathname);
    setOpen(false);
  }

  // 開啟時：Escape 關閉、鎖背景捲動
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? closeLabel : menuLabel}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((value) => !value)}
        className="press -mr-1.5 flex h-10 w-10 items-center justify-center text-white/85 transition-colors hover:text-gold-soft"
      >
        {open ? (
          <IconX size={24} stroke={1.5} />
        ) : (
          <IconMenu2 size={24} stroke={1.5} />
        )}
      </button>

      {/* 遮罩：點擊關閉 */}
      {open && (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="absolute inset-x-0 top-full z-40 h-screen cursor-default bg-ink/60 backdrop-blur-sm"
        />
      )}

      {/* 下拉面板 */}
      <div
        id="mobile-menu"
        className={`absolute inset-x-0 top-full z-50 origin-top border-b border-white/10 bg-ink/98 shadow-2xl shadow-black/40 backdrop-blur-md transition duration-200 ease-out ${
          open
            ? 'visible translate-y-0 opacity-100'
            : 'invisible -translate-y-2 opacity-0'
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-8">
          <div className="flex flex-col divide-y divide-white/10">
            <NavLinks
              links={links}
              activeClass="py-3.5 text-base uppercase tracking-[0.14em] text-gold-soft font-semibold"
              inactiveClass="py-3.5 text-base uppercase tracking-[0.14em] text-white/80 transition-colors hover:text-gold-soft"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <LocaleSwitcher current={locale} label={localeLabel} />
            <NavAuth locale={locale} labels={authLabels} />
          </div>
        </div>
      </div>
    </div>
  );
}
