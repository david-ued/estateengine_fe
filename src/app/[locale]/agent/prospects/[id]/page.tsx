import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProspectManager } from '@/components/agent/prospect-manager';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { ApiError, apiFetch } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { ProspectDetail } from '@/lib/types';

async function fetchDetail(
  token: string,
  userId: string,
): Promise<ProspectDetail | null> {
  try {
    return await apiFetch<ProspectDetail>(`/prospects/${userId}`, {
      token,
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** 單一 prospect 管理：財務準備度 + 物件表態 / Act Fast 洽談 */
export default async function AgentProspectDetailPage({
  params,
}: Readonly<{ params: Promise<{ locale: string; id: string }> }>) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  await requireRole(locale, ['agent']);
  const dict = await getDictionary(locale);
  const crm = dict.agentCrm;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) notFound();

  const detail = await fetchDetail(session.access_token, id);
  if (!detail) notFound();

  const name = detail.buyer.display_name ?? detail.buyer.full_name ?? '—';
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-8">
      <Link
        href={`/${locale}/agent/prospects`}
        className="eyebrow transition-colors hover:text-gold"
      >
        ← {crm.backToList}
      </Link>

      <div className="mb-8 mt-4">
        <h2 className="text-xl font-bold">{name}</h2>
        <p className="mt-1 flex flex-wrap gap-x-4 text-sm text-neutral-500">
          {detail.buyer.email && <span>{detail.buyer.email}</span>}
          {detail.buyer.phone && <span>{detail.buyer.phone}</span>}
          <span>
            {crm.registered} {dateFmt.format(new Date(detail.buyer.created_at))}
          </span>
        </p>
      </div>

      <ProspectManager
        locale={locale}
        detail={detail}
        labels={{
          financeTitle: crm.financeTitle,
          preApproval: crm.preApproval,
          statusLabel: crm.colPreApproval,
          amountLabel: crm.amountLabel,
          proofLabel: crm.proofLabel,
          agentNoteLabel: crm.agentNoteLabel,
          buyerNoteLabel: crm.buyerNoteLabel,
          save: crm.save,
          saving: crm.saving,
          saved: crm.saved,
          error: crm.error,
          interestsTitle: crm.interestsTitle,
          interestsIntro: crm.interestsIntro,
          interestsEmpty: crm.interestsEmpty,
          decision: crm.decision,
          decisionLabel: crm.decisionLabel,
          actFastLabel: crm.actFastLabel,
          actFastBadge: crm.actFastBadge,
          interestNotePlaceholder: crm.interestNotePlaceholder,
          unavailable: dict.account.unavailable,
          updated: crm.updated,
        }}
      />
    </main>
  );
}
