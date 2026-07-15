import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// 核心公開頁（PIVOT.md sitemap）：首頁 / 搜尋 / 關於 / 聯絡 / 法務頁
const routes = [
  { path: '', changeFrequency: 'daily', priority: 1 },
  { path: '/search', changeFrequency: 'hourly', priority: 0.9 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
] as const;

// TODO：DB 連線後補上已上架物件的動態 URL（/properties/[id]）
export default function sitemap(): MetadataRoute.Sitemap {
  return routes.flatMap((route) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${route.path}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${SITE_URL}/${l}${route.path}`] as const),
        ),
      },
    })),
  );
}
