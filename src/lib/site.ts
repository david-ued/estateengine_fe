import type { Locale } from '@/i18n/config';
import { apiFetch } from './api';
import type { SiteInfo, SiteLocaleCopy } from './types';

/**
 * 站台品牌資料（單一 agent + 首頁文案）。
 * BE 未啟動或尚未設定時回傳空物件，頁面以字典預設文案呈現。
 */
export async function getSite(): Promise<SiteInfo> {
  try {
    return await apiFetch<SiteInfo>('/site', {
      next: { revalidate: 120 },
    } as RequestInit);
  } catch {
    return { settings: {}, agent: null };
  }
}

/** 取出目前語系的品牌文案（缺項由呼叫端以字典 fallback） */
export function siteCopy(site: SiteInfo, locale: Locale): SiteLocaleCopy {
  return site.settings.locales?.[locale] ?? {};
}

/** agent 顯示名稱（display_name → full_name → fallback） */
export function agentName(site: SiteInfo, fallback: string): string {
  return site.agent?.display_name || site.agent?.full_name || fallback;
}