import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusActions } from '@/components/agent/status-actions';
import {
  btn,
  tableClass,
  tableWrapClass,
  tdClass,
  thClass,
  theadClass,
  trClass,
} from '@/components/ui/styles';
import { isLocale } from '@/i18n/config';
import { getDictionary, type Dictionary } from '@/i18n/get-dictionary';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { PropertyStatus } from '@/lib/types';

interface AgentListing {
  id: string;
  title: string;
  status: keyof Dictionary['agent']['statusLabels'];
  price: number;
  city: string;
  district: string | null;
  listed_at: string | null;
  view_count: number;
}

function daysOnMarket(listedAt: string | null): number | null {
  if (!listedAt) return null;
  return Math.floor((Date.now() - new Date(listedAt).getTime()) / 86_400_000);
}

export default async function AgentDashboardPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { user } = await requireRole(locale, ['agent']);
  const dict = await getDictionary(locale);

  // RLS：agent 可讀取自己所有狀態的物件
  const supabase = await createClient();
  const { data: listings } = await supabase
    .from('properties')
    .select('id, title, status, price, city, district, listed_at, view_count')
    .eq('agent_id', user.id)
    .order('created_at', { ascending: false })
    .returns<AgentListing[]>();

  // 簡易數據面板（PRD 三指標）：平均停留時間 + 外部影片點擊
  const ids = (listings ?? []).map((listing) => listing.id);
  const dwell = new Map<string, { sum: number; count: number }>();
  const videoClicks = new Map<string, number>();

  if (ids.length > 0) {
    const [{ data: events }, { data: clicks }] = await Promise.all([
      supabase
        .from('property_view_events')
        .select('property_id, duration_seconds')
        .in('property_id', ids)
        .not('duration_seconds', 'is', null)
        .returns<{ property_id: string; duration_seconds: number }[]>(),
      supabase
        .from('media')
        .select('property_id, click_count')
        .in('property_id', ids)
        .in('type', ['external_video', 'tour_3d'])
        .returns<{ property_id: string; click_count: number }[]>(),
    ]);

    for (const event of events ?? []) {
      const entry = dwell.get(event.property_id) ?? { sum: 0, count: 0 };
      entry.sum += Number(event.duration_seconds);
      entry.count += 1;
      dwell.set(event.property_id, entry);
    }
    for (const media of clicks ?? []) {
      videoClicks.set(
        media.property_id,
        (videoClicks.get(media.property_id) ?? 0) + media.click_count,
      );
    }
  }

  const avgDwellOf = (id: string) => {
    const entry = dwell.get(id);
    return entry && entry.count > 0 ? Math.round(entry.sum / entry.count) : null;
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">{dict.agent.myListings}</h2>
        <Link href={`/${locale}/agent/properties/new`} className={btn.primary}>
          + {dict.agent.newListing}
        </Link>
      </div>

      {!listings || listings.length === 0 ? (
        <p className="text-neutral-500">{dict.agent.noListings}</p>
      ) : (
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th scope="col" className={thClass}>{dict.agent.myListings}</th>
                <th scope="col" className={thClass}>{dict.agent.status}</th>
                <th scope="col" className={thClass}>{dict.agent.price}</th>
                <th scope="col" className={thClass}>{dict.agent.daysOnMarket}</th>
                <th scope="col" className={thClass}>{dict.agent.views}</th>
                <th scope="col" className={thClass}>{dict.agent.avgDwell}</th>
                <th scope="col" className={thClass}>{dict.agent.videoClicks}</th>
                <th scope="col" className={thClass}>
                  <span className="sr-only">{dict.agent.edit}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} className={trClass}>
                  <td className={tdClass}>
                    <div className="font-medium">{listing.title}</div>
                    <div className="text-neutral-500">
                      {listing.city}
                      {listing.district ? ` · ${listing.district}` : ''}
                    </div>
                  </td>
                  <td className={tdClass}>
                    {dict.agent.statusLabels[listing.status]}
                  </td>
                  <td className={tdClass}>{listing.price.toLocaleString()}</td>
                  <td className={tdClass}>{daysOnMarket(listing.listed_at) ?? '—'}</td>
                  <td className={tdClass}>{listing.view_count}</td>
                  <td className={tdClass}>{avgDwellOf(listing.id) ?? '—'}</td>
                  <td className={tdClass}>{videoClicks.get(listing.id) ?? 0}</td>
                  <td className={tdClass}>
                    <span className="flex flex-col items-end gap-1.5">
                      <Link
                        href={`/${locale}/agent/properties/${listing.id}/edit`}
                        className={btn.quiet}
                      >
                        {dict.agent.edit}
                      </Link>
                      <StatusActions
                        propertyId={listing.id}
                        status={listing.status as PropertyStatus}
                        labels={dict.agent.actions}
                        errorText={dict.agent.actionError}
                      />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
