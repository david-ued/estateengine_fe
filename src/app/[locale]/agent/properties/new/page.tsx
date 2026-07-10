import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PropertyForm } from '@/components/agent/property-form';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { requireRole } from '@/lib/auth';

/** 行動端優先建檔：房仲在外帶看時用手機隨時建檔 */
export default async function NewPropertyPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireRole(locale, ['agent']);
  const dict = await getDictionary(locale);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-4 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/${locale}/agent`} className="text-sm text-neutral-500 hover:underline">
          ← {dict.common.back}
        </Link>
        <h2 className="text-xl font-bold">{dict.agentForm.pageTitle}</h2>
      </div>
      <PropertyForm locale={locale} labels={dict.agentForm} />
    </main>
  );
}
