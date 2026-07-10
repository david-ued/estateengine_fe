export const locales = ['en', 'fr', 'zh-TW', 'zh-CN'] as const;

export type Locale = (typeof locales)[number];

// 預設繁體中文，其次英文（移民客源優先）
export const defaultLocale: Locale = 'zh-TW';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
