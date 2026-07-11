import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ForceDelistButton } from '@/components/admin/force-delist-button';
import {
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

interface AdminListing {
  id: string;
  title: string;
  status: keyof Dictionary['agent']['statusLabels'];
  price: number;
  city: string;
  view_count: number;
  agent: { display_name: string | null; full_name: string | null } | null;
}

export default async function AdminDashboardPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireRole(locale, ['super_admin']);
  const dict = await getDictionary(locale);

  // RLS：super_admin 可讀取所有狀態的物件（後台巡邏）
  const supabase = await createClient();
  const { data: listings } = await supabase
    .from('properties')
    .select(
      'id, title, status, price, city, view_count, agent:profiles(display_name, full_name)',
    )
    .order('created_at', { ascending: false })
    .limit(50)
    .returns<AdminListing[]>();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 p-8">
      <h2 className="mb-6 text-xl font-bold">{dict.admin.allListings}</h2>

      {!listings || listings.length === 0 ? (
        <p className="text-neutral-500">{dict.admin.empty}</p>
      ) : (
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th scope="col" className={thClass}>{dict.nav.listings}</th>
                <th scope="col" className={thClass}>{dict.admin.agentColumn}</th>
                <th scope="col" className={thClass}>{dict.agent.status}</th>
                <th scope="col" className={thClass}>{dict.agent.price}</th>
                <th scope="col" className={thClass}>
                  <span className="sr-only">{dict.admin.forceDelist}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} className={trClass}>
                  <td className={tdClass}>
                    {/* 點標題進公開詳細頁檢視內容 */}
                    <Link
                      href={`/${locale}/properties/${listing.id}`}
                      className="font-medium text-brand hover:underline"
                    >
                      {listing.title}
                    </Link>
                    <div className="text-neutral-500">{listing.city}</div>
                  </td>
                  <td className={tdClass}>
                    {listing.agent?.display_name ?? listing.agent?.full_name ?? '—'}
                  </td>
                  <td className={tdClass}>
                    {dict.agent.statusLabels[listing.status]}
                  </td>
                  <td className={tdClass}>{listing.price.toLocaleString()}</td>
                  <td className={`${tdClass} text-right`}>
                    {listing.status !== 'delisted' && (
                      <ForceDelistButton
                        propertyId={listing.id}
                        label={dict.admin.forceDelist}
                        confirmText={dict.admin.delistConfirm}
                        errorText={dict.admin.actionError}
                      />
                    )}
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
