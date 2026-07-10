'use client';

import { usePathname, useRouter } from 'next/navigation';
import { selectClass } from '@/components/ui/styles';
import { locales, type Locale } from '@/i18n/config';

const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
};

export function LocaleSwitcher({
  current,
  label,
}: Readonly<{ current: Locale; label: string }>) {
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
      aria-label={label}
      className={selectClass}
    >
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {LOCALE_NAMES[locale]}
        </option>
      ))}
    </select>
  );
}
