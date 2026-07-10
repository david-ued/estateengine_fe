import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 後台不進索引
      disallow: locales.flatMap((locale) => [
        `/${locale}/admin`,
        `/${locale}/agent`,
        `/${locale}/login`,
        `/${locale}/signup`,
      ]),
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
