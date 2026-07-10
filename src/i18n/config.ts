export const locales = ['en', 'fr', 'zh-TW', 'zh-CN'] as const;

export type Locale = (typeof locales)[number];

// 目標市場：加拿大（Edmonton / Vancouver / Toronto），預設英文
export const defaultLocale: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
