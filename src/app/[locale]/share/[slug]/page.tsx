import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';

interface ShareLinkProperty {
  id: string;
  title: string;
  price: number;
  currency: string;
  city: string;
  district: string | null;
  area_sqft: number;
  beds: number;
  baths: number;
}

interface ShareLinkPayload {
  slug: string;
  title: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_path: string | null;
  agent: {
    display_name: string | null;
    full_name: string | null;
    avatar_url: string | null;
    agency_name: string | null;
    bio: string | null;
    phone: string | null;
  } | null;
  items: { sort_order: number; property: ShareLinkProperty }[];
}

async function fetchShareLink(slug: string): Promise<ShareLinkPayload | null> {
  try {
    // 公開端點；同一次 render 中 generateMetadata 與頁面共用（fetch 去重）
    return await apiFetch<ShareLinkPayload>(`/share-links/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}

function ogImageUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-media/${path}`;
}

/** 房仲自訂的社群分享 OG 標籤（SEO Title / Description / Preview Image） */
export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string; slug: string }> }>): Promise<Metadata> {
  const { slug } = await params;
  const link = await fetchShareLink(slug);
  if (!link) return {};

  const agentName = link.agent?.display_name ?? link.agent?.full_name ?? 'EstateEngine';
  const title = link.og_title ?? link.title ?? agentName;
  const description = link.og_description ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: link.og_image_path ? [ogImageUrl(link.og_image_path)] : undefined,
    },
  };
}

export default async function SharePage({
  params,
}: Readonly<{ params: Promise<{ locale: string; slug: string }> }>) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const [dict, link] = await Promise.all([getDictionary(locale), fetchShareLink(slug)]);
  if (!link) notFound();

  const agentName = link.agent?.display_name ?? link.agent?.full_name ?? '';

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-4 sm:p-8">
      {/* 房仲個人化展示：點開清單即帶出專屬房仲介紹 */}
      <header className="mb-8 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          {dict.share.curatedTitle}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{link.title ?? agentName}</h1>
        <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
          <p className="font-medium">
            {dict.share.curatedBy}: {agentName}
            {link.agent?.agency_name ? ` · ${link.agent.agency_name}` : ''}
          </p>
          {link.agent?.bio && <p className="mt-1 text-neutral-500">{link.agent.bio}</p>}
          {link.agent?.phone && (
            <p className="mt-2">
              {dict.common.contactAgent}: {link.agent.phone}
            </p>
          )}
        </div>
      </header>

      <section className="flex flex-col gap-4">
        {link.items.map(({ property }, index) => (
          <a
            key={property.id}
            href={`/${locale}/properties/${property.id}`}
            className="card-lift fade-up rounded-xl border border-neutral-200 p-5 dark:border-neutral-800"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-semibold">{property.title}</h2>
              <span className="whitespace-nowrap font-mono">
                ${property.price.toLocaleString()} {property.currency}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              {property.city}
              {property.district ? ` · ${property.district}` : ''} ·{' '}
              {Number(property.area_sqft).toLocaleString()} {dict.filters.sqft} ·{' '}
              {property.beds} {dict.filters.beds} / {property.baths} {dict.filters.baths}
            </p>
          </a>
        ))}
      </section>
    </main>
  );
}
