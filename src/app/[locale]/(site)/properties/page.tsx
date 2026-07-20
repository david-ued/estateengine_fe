import { notFound, redirect } from 'next/navigation';
import { isLocale } from '@/i18n/config';

/**
 * 列表頁已搬到 /search（PIVOT.md sitemap）：
 * /[locale]/properties 一律轉址並保留 query string；
 * 物件內頁 /[locale]/properties/[id] 不受影響。
 */
export default async function PropertiesRedirect({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === 'string') query.set(key, value);
    else if (Array.isArray(value)) for (const item of value) query.append(key, item);
  }

  const qs = query.toString();
  redirect(`/${locale}/search${qs ? `?${qs}` : ''}`);
}
