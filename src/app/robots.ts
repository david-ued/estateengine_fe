import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // agent 後台與買家帳號區不進索引（/admin 已隨 super_admin 移除）
      disallow: locales.flatMap((locale) => [
        `/${locale}/agent`,
        `/${locale}/account`,
        `/${locale}/login`,
        `/${locale}/signup`,
      ]),
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
