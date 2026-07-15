import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ListingCard } from '@/components/listings/listing-card';
import { Reveal } from '@/components/reveal';
import { btn } from '@/components/ui/styles';
import { isLocale, locales } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';
import { coverImageUrl } from '@/lib/media';
import { agentName, getSite, siteCopy } from '@/lib/site';
import type { PagedResult, Property } from '@/lib/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** 最新 6 筆上架物件（BE 未啟動時回空陣列，首頁仍可渲染） */
async function fetchFeatured(): Promise<Property[]> {
  try {
    const result = await apiFetch<PagedResult<Property>>(
      '/properties?page=1&pageSize=6&sort=newest',
      { next: { revalidate: 60 } } as RequestInit,
    );
    return result.items;
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const [dict, site] = await Promise.all([getDictionary(locale), getSite()]);
  const copy = siteCopy(site, locale);

  return {
    // 首頁以 agent 品牌名為完整標題（不套 layout 的 template）
    title: { absolute: agentName(site, dict.common.appName) },
    description: copy.heroSubtitle ?? dict.home.heroSubtitle,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${SITE_URL}/${l}`] as const),
      ),
    },
  };
}

/** 品牌首頁（The BRAND 式）：hero → 認識房仲 → 實績 → 核心價值 → 精選物件 → 聯絡 CTA */
export default async function HomePage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [dict, site, featured] = await Promise.all([
    getDictionary(locale),
    getSite(),
    fetchFeatured(),
  ]);

  const copy = siteCopy(site, locale);
  const name = agentName(site, dict.common.appName);
  const story = copy.story ?? site.agent?.bio ?? null;
  const avatar = site.agent?.avatar_url ?? null;
  const values = copy.values ?? [];
  const heroImage = featured[0] ? coverImageUrl(featured[0]) : null;

  // 實績數字：只列有資料的項目，全空則整段隱藏
  const stats = site.settings.stats ?? {};
  const statItems: { value: string; label: string }[] = [];
  if (stats.sold != null) {
    statItems.push({
      value: Number(stats.sold).toLocaleString(locale),
      label: dict.home.statSold,
    });
  }
  if (stats.volume) {
    statItems.push({ value: stats.volume, label: dict.home.statVolume });
  }
  if (stats.years != null) {
    statItems.push({ value: String(stats.years), label: dict.home.statYears });
  }

  const cardDict = {
    filters: dict.filters,
    listings: dict.listings,
    favorite: dict.favorite,
  };

  return (
    <main className="flex-1">
      {/* 1. Hero：滿版深色，有封面圖時做為背景 */}
      <section className="relative flex min-h-[82svh] items-center justify-center overflow-hidden bg-ink text-white">
        {heroImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 遠端圖 */}
            <img
              src={heroImage}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 size-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-b from-black/60 via-black/55 to-black/75"
            />
          </>
        )}
        <div className="fade-up relative mx-auto max-w-3xl px-4 py-28 text-center sm:px-8">
          <p className="eyebrow text-gold-soft">{dict.home.heroEyebrow}</p>
          <h1 className="font-display mt-6 text-4xl leading-tight sm:text-6xl">
            {copy.heroTitle ?? dict.home.heroTitle}
          </h1>
          <p className="mt-6 text-base leading-relaxed text-white/80 sm:text-lg">
            {copy.heroSubtitle ?? dict.home.heroSubtitle}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href={`/${locale}/search`} className={btn.onDark}>
              {dict.home.heroSearchCta}
            </Link>
            <Link href={`/${locale}/contact`} className={btn.onDark}>
              {dict.home.heroContactCta}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Meet Your Agent：白底兩欄（無頭像時置中單欄） */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div
            className={
              avatar
                ? 'grid items-center gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20'
                : 'mx-auto max-w-2xl text-center'
            }
          >
            {avatar && (
              <Reveal>
                {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 遠端圖 */}
                <img
                  src={avatar}
                  alt={name}
                  className="aspect-[4/5] w-full object-cover"
                />
              </Reveal>
            )}
            <Reveal delay={avatar ? 120 : 0}>
              <p className="eyebrow">{dict.home.introEyebrow}</p>
              <h2 className="font-display mt-4 text-3xl sm:text-5xl">{name}</h2>
              <div className={`gold-rule mt-6 ${avatar ? '' : 'mx-auto'}`} />
              {story && (
                <p className="mt-6 whitespace-pre-line leading-relaxed text-neutral-600">
                  {story}
                </p>
              )}
              <div className="mt-8">
                <Link href={`/${locale}/about`} className={btn.secondary}>
                  {dict.home.introCta}
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3. Stats band：深色實績數字（無資料整段隱藏） */}
      {statItems.length > 0 && (
        <section className="bg-ink py-20 text-white sm:py-24">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-8">
            <Reveal>
              <p className="eyebrow text-gold-soft">{dict.home.statsEyebrow}</p>
              <h2 className="font-display mt-4 text-3xl sm:text-4xl">
                {dict.home.statsTitle}
              </h2>
            </Reveal>
            <div className="mt-14 grid gap-12 sm:grid-cols-3">
              {statItems.map((item, index) => (
                <Reveal key={item.label} delay={index * 120}>
                  <p className="font-display text-5xl text-gold-soft">
                    {item.value}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.25em] text-white/60">
                    {item.label}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Core values：白底四欄（無資料整段隱藏） */}
      {values.length > 0 && (
        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <Reveal className="text-center">
              <p className="eyebrow">{dict.home.valuesEyebrow}</p>
              <h2 className="font-display mt-4 text-3xl sm:text-4xl">
                {dict.home.valuesTitle}
              </h2>
            </Reveal>
            <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((value, index) => (
                <Reveal key={value.title} delay={index * 100}>
                  <div className="gold-rule" />
                  <h3 className="font-display mt-4 text-xl">{value.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                    {value.body}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Featured listings：淺色精選物件 */}
      <section className="bg-cream py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <Reveal className="text-center">
            <p className="eyebrow">{dict.home.featuredEyebrow}</p>
            <h2 className="font-display mt-4 text-3xl sm:text-4xl">
              {dict.home.featuredTitle}
            </h2>
          </Reveal>
          {featured.length === 0 ? (
            <p className="mt-14 text-center text-neutral-500">
              {dict.home.featuredEmpty}
            </p>
          ) : (
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((property, index) => (
                <ListingCard
                  key={property.id}
                  locale={locale}
                  property={property}
                  dict={cardDict}
                  index={index}
                />
              ))}
            </div>
          )}
          <div className="mt-12 text-center">
            <Link href={`/${locale}/search`} className={btn.secondary}>
              {dict.common.viewAll}
            </Link>
          </div>
        </div>
      </section>

      {/* 6. CTA band：深色聯絡召喚 */}
      <section className="bg-ink py-24 text-white sm:py-32">
        <Reveal className="mx-auto max-w-2xl px-4 text-center sm:px-8">
          <h2 className="font-display text-3xl sm:text-4xl">
            {dict.home.contactCtaTitle}
          </h2>
          <div className="gold-rule mx-auto mt-6" />
          <p className="mt-6 leading-relaxed text-white/70">
            {dict.home.contactCtaBody}
          </p>
          <div className="mt-10">
            <Link href={`/${locale}/contact`} className={btn.onDark}>
              {dict.home.contactCtaButton}
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
