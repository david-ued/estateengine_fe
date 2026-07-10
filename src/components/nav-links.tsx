'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavLink = Readonly<{ href: string; label: string }>;

/**
 * 導覽連結（含目前所在區塊的 active 樣式）。
 * 以最長符合的 href 為準，避免 /agent 與 /agent/share-links 同時被標為 active。
 */
export function NavLinks({
  links,
  activeClass = 'font-semibold text-brand',
  inactiveClass = 'text-neutral-600 transition-colors hover:text-foreground dark:text-neutral-400',
}: Readonly<{
  links: readonly NavLink[];
  activeClass?: string;
  inactiveClass?: string;
}>) {
  const pathname = usePathname();

  const activeHref = links.reduce<string | null>((best, link) => {
    const matches =
      pathname === link.href || pathname.startsWith(`${link.href}/`);
    if (!matches) return best;
    return best && best.length >= link.href.length ? best : link.href;
  }, null);

  return (
    <>
      {links.map((link) => {
        const isActive = link.href === activeHref;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={`whitespace-nowrap ${isActive ? activeClass : inactiveClass}`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
