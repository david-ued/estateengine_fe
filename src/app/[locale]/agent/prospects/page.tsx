import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  badgeClass,
  btn,
  tableClass,
  tableWrapClass,
  tdClass,
  thClass,
  theadClass,
  trClass,
} from '@/components/ui/styles';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { PreApprovalStatus, ProspectListItem } from '@/lib/types';

async function fetchProspects(
  token: string,
): Promise<{ items: ProspectListItem[] } | null> {
  try {
    return await apiFetch<{ items: ProspectListItem[] }>('/prospects', {
      token,
      cache: 'no-store',
    });
  } catch {
    return null;
  }
}

/** 預批狀態徽章配色：已取得金、辦理中細框、未辦理灰字 */
const PRE_APPROVAL_BADGE: Record<PreApprovalStatus, string> = {
  none: 'text-neutral-400',
  in_progress:
    'border border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300',
  approved: 'bg-ink text-gold-soft',
};

/** Prospect CRM 列表：買家財務準備度 + 表態彙總，點入單一買家管理 */
export default async function AgentProspectsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireRole(locale, ['agent']);
  const dict = await getDictionary(locale);
  const crm = dict.agentCrm;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const result = session ? await fetchProspects(session.access_token) : null;

  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold">{crm.title}</h2>
        <p className="mt-1 text-sm text-neutral-500">{crm.subtitle}</p>
      </div>

      {result === null ? (
        <div className="flex flex-col items-center gap-4 border border-neutral-200 py-16 text-center dark:border-neutral-800">
          <p className="text-neutral-500">{crm.loadError}</p>
          <Link href={`/${locale}/agent/prospects`} className={btn.secondary}>
            {dict.common.retry}
          </Link>
        </div>
      ) : result.items.length === 0 ? (
        <p className="border border-neutral-200 px-6 py-16 text-center text-neutral-500 dark:border-neutral-800">
          {crm.empty}
        </p>
      ) : (
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th scope="col" className={thClass}>
                  {crm.colName}
                </th>
                <th scope="col" className={thClass}>
                  {crm.colPreApproval}
                </th>
                <th scope="col" className={thClass}>
                  {crm.colSignals}
                </th>
                <th scope="col" className={thClass}>
                  {crm.colFavorites}
                </th>
                <th scope="col" className={thClass}>
                  {crm.colActivity}
                </th>
                <th scope="col" className={thClass}>
                  <span className="sr-only">{crm.view}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((p) => {
                const status = p.finance?.pre_approval_status ?? 'none';
                return (
                  <tr key={p.id} className={trClass}>
                    <td className={tdClass}>
                      <div className="font-medium">
                        {p.display_name ?? p.full_name ?? '—'}
                      </div>
                      <div className="text-neutral-500">{p.email ?? '—'}</div>
                    </td>
                    <td className={tdClass}>
                      <span
                        className={`${badgeClass} ${PRE_APPROVAL_BADGE[status]}`}
                      >
                        {crm.preApproval[status]}
                      </span>
                      {p.finance?.proof_of_funds && (
                        <div className="mt-1 text-xs text-neutral-500">
                          {crm.proofReady}
                        </div>
                      )}
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-1.5">
                        {p.lockedIn > 0 && (
                          <span className={`${badgeClass} bg-ink text-gold-soft`}>
                            {crm.lockedShort.replace('{n}', String(p.lockedIn))}
                          </span>
                        )}
                        {p.actFast > 0 && (
                          <span
                            className={`${badgeClass} border border-gold text-gold`}
                          >
                            {crm.actFastShort.replace('{n}', String(p.actFast))}
                          </span>
                        )}
                        {p.lockedIn === 0 && p.actFast === 0 && (
                          <span className="text-neutral-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className={`${tdClass} text-neutral-500`}>
                      {p.favorites}
                    </td>
                    <td className={`${tdClass} text-neutral-500`}>
                      {p.lastActivity
                        ? dateFmt.format(new Date(p.lastActivity))
                        : '—'}
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <Link
                        href={`/${locale}/agent/prospects/${p.id}`}
                        className={btn.quiet}
                      >
                        {crm.view}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
