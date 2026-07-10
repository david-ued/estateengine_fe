import { IconPhone } from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createClient } from '@/lib/supabase/server';

interface AgentRow {
  id: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  agency_name: string | null;
  bio: string | null;
  phone: string | null;
}

/** 房仲列表：提升信任感與個人品牌 */
export default async function AgentsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const [{ data: agents }, { data: listingRows }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, full_name, avatar_url, agency_name, bio, phone')
      .eq('role', 'agent')
      .returns<AgentRow[]>(),
    supabase
      .from('properties')
      .select('agent_id, city')
      .eq('status', 'published')
      .returns<{ agent_id: string; city: string }[]>(),
  ]);

  // 每位房仲的上架數與主打區域（上架最多的城市）
  const stats = new Map<string, { count: number; cities: Map<string, number> }>();
  for (const row of listingRows ?? []) {
    const entry = stats.get(row.agent_id) ?? { count: 0, cities: new Map() };
    entry.count += 1;
    entry.cities.set(row.city, (entry.cities.get(row.city) ?? 0) + 1);
    stats.set(row.agent_id, entry);
  }
  const focusCity = (agentId: string) => {
    const cities = stats.get(agentId)?.cities;
    if (!cities || cities.size === 0) return null;
    return [...cities.entries()].sort((a, b) => b[1] - a[1])[0][0];
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-8">
      <h1 className="text-2xl font-bold">{dict.agents.title}</h1>
      <p className="mt-1 mb-6 text-sm text-neutral-500">{dict.agents.subtitle}</p>

      {!agents || agents.length === 0 ? (
        <p className="py-16 text-center text-neutral-500">{dict.agents.empty}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent, index) => (
            <Link
              key={agent.id}
              href={`/${locale}/agents/${agent.id}`}
              className="card-lift fade-up flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="flex items-center gap-3">
                {agent.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 遠端圖
                  <img
                    src={agent.avatar_url}
                    alt=""
                    className="size-16 rounded-full object-cover shadow-sm"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex size-16 items-center justify-center rounded-full bg-neutral-100 text-2xl dark:bg-neutral-800"
                  >
                    👤
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {agent.display_name ?? agent.full_name}
                  </p>
                  {agent.agency_name && (
                    <p className="truncate text-sm text-neutral-500">{agent.agency_name}</p>
                  )}
                </div>
              </div>
              {agent.bio && (
                <p className="line-clamp-2 text-sm text-neutral-500">{agent.bio}</p>
              )}
              <div className="mt-auto flex items-center justify-between text-sm">
                <span className="text-neutral-500">
                  {focusCity(agent.id) ? `${dict.agents.focus}: ${focusCity(agent.id)} · ` : ''}
                  {stats.get(agent.id)?.count ?? 0} {dict.agents.listings}
                </span>
                {agent.phone && (
                  <span className="flex items-center gap-1 text-brand">
                    <IconPhone size={15} /> {agent.phone}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
