import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ListingCard } from '@/components/listings/listing-card';
import { btn } from '@/components/ui/styles';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';
import { agentName, getSite, siteCopy } from '@/lib/site';
import type { PagedResult, Property } from '@/lib/types';

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.about.title };
}

/** 服務中的物件：最新 6 筆（後端未啟動時回空陣列，顯示 listingsEmpty） */
async function fetchNewestListings(): Promise<Property[]> {
  try {
    const result = await apiFetch<PagedResult<Property>>(
      '/properties?page=1&pageSize=6&sort=newest',
      { cache: 'no-store' },
    );
    return result.items;
  } catch {
    return [];
  }
}

/** 單一 agent 品牌頁（PIVOT.md：取代原 /agents 路由） */
export default async function AboutPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [dict, site, properties] = await Promise.all([
    getDictionary(locale),
    getSite(),
    fetchNewestListings(),
  ]);

  const name = agentName(site, dict.common.appName);
  const agent = site.agent;
  const story = siteCopy(site, locale).story;
  const socials = Object.entries(agent?.social_links ?? {}).filter(([, url]) =>
    Boolean(url),
  );

  return (
    <main className="flex-1">
      {/* 頁首深色帶 */}
      <section className="bg-ink py-16 text-white">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
          <p className="eyebrow">{dict.about.eyebrow}</p>
          <h1 className="font-display mt-4 text-4xl tracking-wide sm:text-5xl">
            {name}
          </h1>
        </div>
      </section>

      {/* 主體兩欄：大頭像 + 介紹 */}
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-16">
        <div>
          {agent?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 遠端圖
            <img
              src={agent.avatar_url}
              alt={name}
              className="aspect-[4/5] w-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex aspect-[4/5] w-full items-center justify-center border border-neutral-200 bg-cream dark:border-neutral-800 dark:bg-neutral-900"
            >
              <span className="font-display text-7xl text-gold">
                {name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {agent?.license_no && (
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">
              {dict.about.licensePrefix} {agent.license_no}
            </p>
          )}

          <div className="gold-rule" />

          {agent?.bio && (
            <p className="whitespace-pre-line leading-relaxed text-neutral-700 dark:text-neutral-300">
              {agent.bio}
            </p>
          )}

          {socials.length > 0 && (
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-[0.14em]">
              {socials.map(([key, url]) => (
                <li key={key}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-gold"
                  >
                    {key}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 我的故事（site_settings 品牌文案，無則隱藏） */}
      {story && (
        <section className="bg-cream py-16 dark:bg-neutral-900">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-8">
            <h2 className="font-display text-3xl">{dict.about.storyTitle}</h2>
            <div className="gold-rule mt-4" />
            <p className="mt-6 whitespace-pre-line leading-relaxed text-neutral-700 dark:text-neutral-300">
              {story}
            </p>
          </div>
        </section>
      )}

      {/* 服務中的物件 */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-8">
        <h2 className="font-display text-3xl">{dict.about.listingsTitle}</h2>
        <div className="gold-rule mt-4" />
        {properties.length === 0 ? (
          <p className="mt-8 text-neutral-500">{dict.about.listingsEmpty}</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property, index) => (
              <ListingCard
                key={property.id}
                locale={locale}
                property={property}
                index={index}
                dict={{
                  filters: dict.filters,
                  listings: dict.listings,
                  favorite: dict.favorite,
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* CTA band */}
      <section className="bg-ink py-16 text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 px-4 text-center sm:px-8">
          <h2 className="font-display text-3xl sm:text-4xl">
            {dict.about.ctaTitle}
          </h2>
          <div className="gold-rule" />
          <Link href={`/${locale}/contact`} className={btn.onDark}>
            {dict.about.ctaButton}
          </Link>
        </div>
      </section>
    </main>
  );
}
