'use client';

import { usePathname, useRouter } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';

// 短標籤（等寬按鈕用），語言自稱不隨介面語系變動
const LOCALE_SHORT: Record<Locale, string> = {
  'zh-TW': '繁中',
  en: 'EN',
};

const LOCALE_FULL: Record<Locale, string> = {
  'zh-TW': '繁體中文',
  en: 'English',
};

/**
 * 語言切換 segmented control（深色導覽列配色）：
 * 自製等寬按鈕取代原生 select，選中金字、未選白字 hover 金。
 */
export function LocaleSwitcher({
  current,
  label,
}: Readonly<{ current: Locale; label: string }>) {
  const router = useRouter();
  const pathname = usePathname();

  function switchTo(next: Locale) {
    if (next === current) return;
    const segments = pathname.split('/');
    segments[1] = next; // /{locale}/...
    router.push(segments.join('/') || `/${next}`);
  }

  return (
    <div
      role="group"
      aria-label={label}
      className="flex divide-x divide-white/25 border border-white/40"
    >
      {locales.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-pressed={active}
            aria-label={LOCALE_FULL[locale]}
            onClick={() => switchTo(locale)}
            className={`press flex h-8 w-14 items-center justify-center text-xs tracking-[0.08em] transition-colors ${
              active
                ? 'bg-white/10 font-semibold text-gold-soft'
                : 'text-white/70 hover:text-gold-soft'
            }`}
          >
            {LOCALE_SHORT[locale]}
          </button>
        );
      })}
    </div>
  );
}
