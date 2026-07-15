// 單一 agent 轉向（PIVOT.md）：縮為 zh-TW + en，華人買家優先
export const locales = ['zh-TW', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'zh-TW';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
