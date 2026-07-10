import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// TODO：DB 連線後補上已上架物件的動態 URL（/properties/[id]）
export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) => [
    {
      url: `${SITE_URL}/${locale}`,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${SITE_URL}/${locale}/properties`,
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
  ]);
}
