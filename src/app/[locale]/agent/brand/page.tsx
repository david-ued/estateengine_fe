import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BrandSettingsForm } from '@/components/agent/brand-settings-form';
import { btn } from '@/components/ui/styles';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import type { SiteInfo } from '@/lib/types';

/** 品牌設定：個人名片（PATCH /site/profile）+ 首頁內容（PUT /site/settings） */
export default async function AgentBrandPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireRole(locale, ['agent']);
  const dict = await getDictionary(locale);

  // 先帶入現值；讀取失敗時不給空表單（避免存檔覆蓋既有設定）
  let site: SiteInfo | null = null;
  try {
    site = await apiFetch<SiteInfo>('/site', { cache: 'no-store' });
  } catch {
    site = null;
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-8">
      <h2 className="mb-6 text-xl font-bold">{dict.brand.title}</h2>
      {site === null ? (
        <div className="flex flex-col items-center gap-4 border border-neutral-200 py-16 text-center dark:border-neutral-800">
          <p className="text-neutral-500">{dict.common.errorBody}</p>
          <Link href={`/${locale}/agent/brand`} className={btn.secondary}>
            {dict.common.retry}
          </Link>
        </div>
      ) : (
        <BrandSettingsForm
          labels={dict.brand}
          agent={site.agent}
          settings={site.settings}
        />
      )}
    </main>
  );
}
