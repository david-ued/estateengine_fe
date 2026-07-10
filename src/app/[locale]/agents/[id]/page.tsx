import { IconChevronLeft, IconPhone } from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ListingCard } from '@/components/listings/listing-card';
import { btn } from '@/components/ui/styles';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createClient } from '@/lib/supabase/server';
import type { Property } from '@/lib/types';

interface AgentRow {
  id: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  agency_name: string | null;
  bio: string | null;
  phone: string | null;
}

/** 房仲專屬頁：個人介紹 + 該房仲所有上架物件 */
export default async function AgentDetailPage({
  params,
}: Readonly<{ params: Promise<{ locale: string; id: string }> }>) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const [{ data: agent }, { data: listings }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, full_name, avatar_url, agency_name, bio, phone')
      .eq('id', id)
      .eq('role', 'agent')
      .maybeSingle<AgentRow>(),
    supabase
      .from('properties')
      .select('*, media(*), agent:profiles(id, display_name, full_name, avatar_url, agency_name)')
      .eq('agent_id', id)
      .eq('status', 'published')
      .order('listed_at', { ascending: false })
      .returns<Property[]>(),
  ]);

  if (!agent) notFound();
  const name = agent.display_name ?? agent.full_name ?? '';

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-8">
      <Link
        href={`/${locale}/agents`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 transition hover:text-neutral-800 hover:underline dark:hover:text-neutral-200"
      >
        <IconChevronLeft size={16} /> {dict.agents.backToAgents}
      </Link>

      {/* 房仲個人介紹 */}
      <header className="mb-8 flex flex-col items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-6 sm:flex-row sm:items-center dark:border-neutral-800 dark:bg-neutral-950">
        {agent.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 遠端圖
          <img
            src={agent.avatar_url}
            alt={name}
            className="size-24 rounded-full object-cover shadow-md"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-24 items-center justify-center rounded-full bg-neutral-100 text-4xl dark:bg-neutral-800"
          >
            👤
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{name}</h1>
          {agent.agency_name && (
            <p className="text-sm text-neutral-500">{agent.agency_name}</p>
          )}
          {agent.bio && (
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{agent.bio}</p>
          )}
        </div>
        {agent.phone && (
          <a href={`tel:${agent.phone}`} className={btn.primary}>
            <IconPhone size={16} /> {dict.common.contactAgent}
          </a>
        )}
      </header>

      {/* 該房仲代理的上架物件 */}
      <h2 className="mb-4 text-lg font-semibold">
        {dict.agents.listings}（{listings?.length ?? 0}）
      </h2>
      {!listings || listings.length === 0 ? (
        <p className="py-12 text-center text-neutral-500">{dict.listings.noResults}</p>
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((property, index) => (
            <ListingCard
              key={property.id}
              locale={locale}
              property={{ ...property, agent: undefined }}
              index={index}
              dict={{
                filters: dict.filters,
                listings: dict.listings,
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}
