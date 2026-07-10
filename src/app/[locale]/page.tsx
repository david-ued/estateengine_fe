import { notFound, redirect } from 'next/navigation';
import { isLocale } from '@/i18n/config';

/** 落地即看到物件列表（Airbnb 式），品牌首頁之後再擴充 */
export default async function HomePage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  redirect(`/${locale}/properties`);
}
