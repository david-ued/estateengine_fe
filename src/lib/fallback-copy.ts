/**
 * error.tsx / not-found.tsx 是 client component，拿不到 server-only 的 getDictionary，
 * 故以 pathname 推出 locale 後使用這份最小文案表（與字典 common.* 同步維護）。
 */

import { defaultLocale, isLocale, type Locale } from '@/i18n/config';

export type FallbackCopy = {
  errorTitle: string;
  errorBody: string;
  retry: string;
  notFoundTitle: string;
  notFoundBody: string;
  backHome: string;
};

const COPY: Record<Locale, FallbackCopy> = {
  'zh-TW': {
    errorTitle: '發生錯誤',
    errorBody: '頁面載入失敗，請稍後再試。',
    retry: '重試',
    notFoundTitle: '找不到頁面',
    notFoundBody: '這個頁面不存在或已被移除。',
    backHome: '回首頁',
  },
  en: {
    errorTitle: 'Something went wrong',
    errorBody: 'The page failed to load. Please try again later.',
    retry: 'Retry',
    notFoundTitle: 'Page not found',
    notFoundBody: 'This page does not exist or has been removed.',
    backHome: 'Back to home',
  },
};

export function localeFromPathname(pathname: string | null): Locale {
  const segment = pathname?.split('/')[1] ?? '';
  return isLocale(segment) ? segment : defaultLocale;
}

export function getFallbackCopy(pathname: string | null): {
  locale: Locale;
  copy: FallbackCopy;
} {
  const locale = localeFromPathname(pathname);
  return { locale, copy: COPY[locale] };
}
