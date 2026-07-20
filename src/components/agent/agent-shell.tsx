'use client';

import {
  IconExternalLink,
  IconInbox,
  IconLayoutDashboard,
  IconMenu2,
  IconPalette,
  IconPlus,
  IconShare3,
  IconUsers,
  IconX,
  type IconProps,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ComponentType } from 'react';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { cn } from '@/lib/utils';

export interface AgentNavItem {
  /** 對應圖示的鍵值（圖示只在 client 端解析，故 server 僅傳字串） */
  key: 'listings' | 'new' | 'shareLinks' | 'inbox' | 'brand' | 'users';
  href: string;
  label: string;
}

const ICONS: Record<AgentNavItem['key'], ComponentType<IconProps>> = {
  listings: IconLayoutDashboard,
  new: IconPlus,
  shareLinks: IconShare3,
  inbox: IconInbox,
  brand: IconPalette,
  users: IconUsers,
};

/**
 * Agent 後台外殼：左側深色 side nav（桌機常駐、手機抽屜）。
 * 以最長符合的 href 判定 active，避免 /agent 與 /agent/inbox 同時亮起。
 */
export function AgentShell({
  locale,
  brand,
  userName,
  dashboardLabel,
  viewSiteLabel,
  signOutLabel,
  menuLabel,
  closeLabel,
  navItems,
  children,
}: Readonly<{
  locale: string;
  brand: string;
  userName: string;
  dashboardLabel: string;
  viewSiteLabel: string;
  signOutLabel: string;
  menuLabel: string;
  closeLabel: string;
  navItems: readonly AgentNavItem[];
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeDrawer = () => setOpen(false);

  // 抽屜開啟時鎖住背景捲動（外部系統副作用，非 setState）
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const activeHref = navItems.reduce<string | null>((best, item) => {
    const matches =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (!matches) return best;
    return best && best.length >= item.href.length ? best : item.href;
  }, null);

  const sidebar = (
    <div className="flex h-full flex-col bg-ink text-white">
      {/* 品牌 + 後台標題 */}
      <div className="border-b border-white/10 px-6 py-6">
        <Link
          href={`/${locale}`}
          className="font-display text-lg tracking-wide transition-opacity hover:opacity-75"
        >
          {brand}
        </Link>
        <p className="eyebrow mt-2">{dashboardLabel}</p>
      </div>

      {/* 導覽項目 */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = ICONS[item.key];
            const isActive = item.href === activeHref;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeDrawer}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'press flex items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-white/10 font-semibold text-gold-soft'
                      : 'text-white/70 hover:bg-white/5 hover:text-gold-soft',
                  )}
                >
                  <Icon
                    size={18}
                    stroke={1.75}
                    className={cn(
                      'shrink-0',
                      isActive ? 'text-gold-soft' : 'text-white/50',
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 使用者 + 回到網站 + 登出 */}
      <div className="border-t border-white/10 px-4 py-4">
        <p className="truncate px-1 text-xs uppercase tracking-[0.12em] text-white/45">
          {userName}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <Link
            href={`/${locale}`}
            onClick={closeDrawer}
            className="press flex items-center gap-2 px-1 py-1.5 text-xs uppercase tracking-[0.12em] text-white/70 transition-colors hover:text-gold-soft"
          >
            <IconExternalLink size={16} stroke={1.75} />
            {viewSiteLabel}
          </Link>
          <SignOutButton
            locale={locale}
            label={signOutLabel}
            className="press flex w-full items-center justify-center border border-white/25 px-3 py-2 text-xs uppercase tracking-[0.12em] text-white/85 transition-colors hover:border-gold hover:text-gold-soft"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1">
      {/* 桌機常駐 side nav */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 md:block">
        {sidebar}
      </aside>

      {/* 手機抽屜遮罩（淡入淡出） */}
      <button
        type="button"
        aria-label={closeLabel}
        tabIndex={open ? 0 : -1}
        onClick={closeDrawer}
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden motion-reduce:transition-none',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      {/* 手機抽屜（左側滑入） */}
      <aside
        aria-hidden={!open}
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 max-w-[82vw] shadow-2xl transition-transform duration-300 ease-out md:hidden motion-reduce:transition-none',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button
          type="button"
          aria-label={closeLabel}
          tabIndex={open ? 0 : -1}
          onClick={closeDrawer}
          className="press absolute right-3 top-5 z-10 text-white/70 hover:text-white"
        >
          <IconX size={22} stroke={1.75} />
        </button>
        {sidebar}
      </aside>

      {/* 內容區 */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 手機頂列（含漢堡） */}
        <header className="flex items-center gap-3 border-b border-white/10 bg-ink px-4 py-3 text-white md:hidden">
          <button
            type="button"
            aria-label={menuLabel}
            onClick={() => setOpen(true)}
            className="press -ml-1 p-1 text-white/80 hover:text-gold-soft"
          >
            <IconMenu2 size={22} stroke={1.75} />
          </button>
          <span className="font-display text-base tracking-wide">{brand}</span>
        </header>
        {children}
      </div>
    </div>
  );
}
