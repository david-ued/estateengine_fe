import { notFound } from 'next/navigation';
import {
  ShareLinkManager,
  type ExistingShareLink,
  type ShareLinkListing,
} from '@/components/agent/share-link-manager';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

/** 房仲高自訂分享：一鍵生成專屬推薦清單 + 自訂 OG 標籤 */
export default async function ShareLinksPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { user } = await requireRole(locale, ['agent']);
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const [{ data: listings }, { data: links }] = await Promise.all([
    supabase
      .from('properties')
      .select('id, title, city, status')
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false })
      .returns<ShareLinkListing[]>(),
    supabase
      .from('share_links')
      .select('id, slug, title, click_count')
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false })
      .returns<ExistingShareLink[]>(),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-8">
      <h2 className="mb-6 text-xl font-bold">{dict.shareLinks.pageTitle}</h2>
      <ShareLinkManager
        locale={locale}
        labels={dict.shareLinks}
        listings={listings ?? []}
        links={links ?? []}
      />
    </main>
  );
}
