import { notFound } from 'next/navigation';
import { ForceDelistButton } from '@/components/admin/force-delist-button';
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
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-3">{dict.nav.listings}</th>
                <th className="px-4 py-3">{dict.admin.agentColumn}</th>
                <th className="px-4 py-3">{dict.agent.status}</th>
                <th className="px-4 py-3">{dict.agent.price}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr
                  key={listing.id}
                  className="border-t border-neutral-200 dark:border-neutral-800"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{listing.title}</div>
                    <div className="text-neutral-500">{listing.city}</div>
                  </td>
                  <td className="px-4 py-3">
                    {listing.agent?.display_name ?? listing.agent?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {dict.agent.statusLabels[listing.status]}
                  </td>
                  <td className="px-4 py-3">{listing.price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    {listing.status !== 'delisted' && (
                      <ForceDelistButton
                        propertyId={listing.id}
                        label={dict.admin.forceDelist}
                        confirmText={dict.admin.delistConfirm}
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
