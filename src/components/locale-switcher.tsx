'use client';

import { usePathname, useRouter } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';

const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
};

export function LocaleSwitcher({ current }: Readonly<{ current: Locale }>) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    const segments = pathname.split('/');
    segments[1] = next; // /{locale}/...
    router.push(segments.join('/') || `/${next}`);
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      aria-label="Language"
      className="rounded-lg border border-neutral-300 bg-transparent px-2 py-1.5 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900"
    >
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {LOCALE_NAMES[locale]}
        </option>
      ))}
    </select>
  );
}
