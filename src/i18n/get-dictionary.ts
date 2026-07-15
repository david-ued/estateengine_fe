import 'server-only';
import type { Locale } from './config';
import type zhTW from './dictionaries/zh-TW.json';

/** 以 zh-TW 字典為權威結構，兩個語系檔的 key 必須一致 */
export type Dictionary = typeof zhTW;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  'zh-TW': () => import('./dictionaries/zh-TW.json').then((m) => m.default),
  en: () => import('./dictionaries/en.json').then((m) => m.default),
};

export const getDictionary = (locale: Locale) => dictionaries[locale]();
