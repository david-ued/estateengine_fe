import { IconChevronLeft } from '@tabler/icons-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { EmbedFrame } from '@/components/property/embed-frame';
import { FeatureGrid, type FeatureRow } from '@/components/property/feature-grid';
import { MortgageCalculator } from '@/components/property/mortgage-calculator';
import { PropertyGallery } from '@/components/property/property-gallery';
import { PropertyMap } from '@/components/property/property-map';
import { ShareButton } from '@/components/property/share-button';
import { ViewTracker } from '@/components/property/view-tracker';
import { Reveal } from '@/components/reveal';
import { badgeClass, btn, cardClass } from '@/components/ui/styles';
import { isLocale } from '@/i18n/config';
import { getDictionary, type Dictionary } from '@/i18n/get-dictionary';
import { ApiError, apiFetch } from '@/lib/api';
import { getUserProfile } from '@/lib/auth';
import { coverImageUrl, externalMedia, storagePublicUrl } from '@/lib/media';
import { createClient } from '@/lib/supabase/server';
import type { Property } from '@/lib/types';

// PRD：專注展示上市 20-30 天內的新鮮物件 → 30 天內標示新上市（同 listing-card）
const FRESH_DAYS = 30;

async function fetchProperty(id: string): Promise<Property | null> {
  try {
    return await apiFetch<Property>(`/properties/${id}`, { cache: 'no-store' });
  } catch (error) {
    // 404 → notFound；其餘（後端未啟動等）拋出交給 error boundary
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

// generateMetadata 與頁面同一次 render 共用結果（no-store 不進 fetch cache，改用 React cache 去重）
const getProperty = cache(fetchProperty);

function daysOnMarket(listedAt: string | null): number | null {
  if (!listedAt) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(listedAt).getTime()) / 86_400_000));
}

function Stars({ count }: Readonly<{ count: number }>) {
  return (
    <span className="text-gold-soft" aria-label={`${count} / 5`}>
      <span aria-hidden="true">{'★'.repeat(count)}</span>
    </span>
  );
}

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string; id: string }> }>): Promise<Metadata> {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) return {};

  const description =
    property.description?.replace(/\s+/g, ' ').trim().slice(0, 160) || undefined;
  const cover = coverImageUrl(property);

  return {
    title: property.title,
    description,
    openGraph: {
      title: property.title,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: Readonly<{ params: Promise<{ locale: string; id: string }> }>) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const [dict, publicProperty] = await Promise.all([
    getDictionary(locale),
    getProperty(id),
  ]);

  // 公開 API 只回 published；未公開物件由 RLS 決定誰能看（擁有者）
  let property = publicProperty;
  let isPrivateView = false;
  if (!property) {
    const session = await getUserProfile();
    if (session) {
      const supabase = await createClient();
      const { data } = await supabase
        .from('properties')
        .select(
          '*, media(*), agent:profiles(id, display_name, full_name, avatar_url, agency_name, bio, phone, social_links)',
        )
        .eq('id', id)
        .maybeSingle<Property>();
      if (data) {
        property = data;
        isPrivateView = data.status !== 'published';
      }
    }
  }
  if (!property) notFound();

  const p = dict.property;
  const form = dict.agentForm;
  const agent = property.agent;
  const embeds = externalMedia(property);

  // 圖片：封面優先，其餘依 sort_order
  const galleryImages = (property.media ?? [])
    .filter(
      (m) =>
        (m.type === 'image' || m.type === 'virtual_staging_image') && m.storage_path,
    )
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)
    .map((image, index) => ({
      id: image.id,
      url: storagePublicUrl(image.storage_path!),
      alt: p.photoAlt
        .replace('{title}', property.title)
        .replace('{index}', String(index + 1)),
    }));

  const priceNumber = Number(property.price);
  const sqft = Number(property.area_sqft);
  const dom = daysOnMarket(property.listed_at);
  const isPublished = property.status === 'published';
  const isFresh = isPublished && dom !== null && dom <= FRESH_DAYS;
  const pricePerSqft = sqft > 0 ? Math.round(priceNumber / sqft) : null;
  const typeLabel = property.property_type
    ? (form.propertyTypes[
        property.property_type as keyof Dictionary['agentForm']['propertyTypes']
      ] ?? property.property_type)
    : null;
  const hasMap = property.lat != null && property.lng != null;

  const inquireHref = `/${locale}/contact?property=${property.id}&title=${encodeURIComponent(property.title)}`;

  // 頂部 anchor tabs：只列出實際存在的 section
  const tabs = [
    { href: '#details', label: p.tabDetails },
    ...(hasMap ? [{ href: '#map', label: p.tabMap }] : []),
    { href: '#exclusive', label: p.tabExclusive },
    { href: '#mortgage', label: p.tabMortgage },
  ];

  // 統計列：beds / baths / sqft / type
  const stats = [
    { label: p.bedrooms, value: property.beds.toLocaleString(locale) },
    { label: p.bathrooms, value: property.baths.toLocaleString(locale) },
    { label: p.squareFeet, value: sqft.toLocaleString(locale) },
    { label: p.type, value: typeLabel ?? '—' },
  ];

  // Property Features 三小節（label 用 dict.property.*）
  const locationRows: FeatureRow[] = [{ label: p.city, value: property.city }];
  if (property.district) locationRows.push({ label: p.district, value: property.district });
  if (property.address) locationRows.push({ label: p.address, value: property.address });
  if (property.school_district)
    locationRows.push({ label: p.schoolDistrict, value: property.school_district });

  const interiorRows: FeatureRow[] = [
    { label: p.squareFeet, value: `${sqft.toLocaleString(locale)} SqFt` },
    { label: p.bedrooms, value: property.beds.toLocaleString(locale) },
    { label: p.bathrooms, value: property.baths.toLocaleString(locale) },
    { label: p.basement, value: form.basementOptions[property.basement_status] },
    { label: p.parking, value: property.has_parking ? p.parkingYes : p.parkingNo },
  ];

  const additionalRows: FeatureRow[] = [];
  if (typeLabel) additionalRows.push({ label: p.type, value: typeLabel });
  additionalRows.push({
    label: p.status,
    value: dict.agent.statusLabels[property.status],
  });
  if (dom !== null)
    additionalRows.push({ label: p.daysOnMarket, value: dom.toLocaleString(locale) });
  if (pricePerSqft !== null)
    additionalRows.push({
      label: p.pricePerSqft,
      value: `$${pricePerSqft.toLocaleString(locale)}`,
    });
  if (property.builder_name)
    additionalRows.push({ label: p.builderName, value: property.builder_name });

  const featureGroups = [
    { heading: p.locationInfo, rows: locationRows },
    { heading: p.interiorInfo, rows: interiorRows },
    { heading: p.additionalInfo, rows: additionalRows },
  ];

  // 獨家數據：只顯示有填的欄位（淹水區一律顯示是/否）
  const exclusiveRows: FeatureRow[] = [];
  if (property.school_district)
    exclusiveRows.push({ label: p.schoolDistrict, value: property.school_district });
  if (property.transit_notes)
    exclusiveRows.push({ label: p.transitNotes, value: property.transit_notes });
  exclusiveRows.push({
    label: p.floodZone,
    value: property.flood_zone ? p.floodYes : p.floodNo,
  });
  if (property.terrain_notes)
    exclusiveRows.push({ label: p.terrainNotes, value: property.terrain_notes });
  if (property.feng_shui_orientation)
    exclusiveRows.push({
      label: p.fengShuiOrientation,
      value:
        form.orientations[
          property.feng_shui_orientation as keyof Dictionary['agentForm']['orientations']
        ] ?? property.feng_shui_orientation,
    });
  if (property.feng_shui_notes)
    exclusiveRows.push({ label: p.fengShuiNotes, value: property.feng_shui_notes });
  if (property.builder_name)
    exclusiveRows.push({ label: p.builderName, value: property.builder_name });
  if (property.builder_reputation)
    exclusiveRows.push({
      label: p.builderReputation,
      value: <Stars count={property.builder_reputation} />,
    });
  if (property.material_grade)
    exclusiveRows.push({
      label: p.materialGrade,
      value: <Stars count={property.material_grade} />,
    });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-8">
      <ViewTracker propertyId={property.id} />

      {isPrivateView && (
        <p className="mt-4 border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          {p.statusBanner.replace('{status}', dict.agent.statusLabels[property.status])}
        </p>
      )}

      {/* 1. sticky anchor tabs + Share / Save（nav 高約 71px，故 top-[70px]） */}
      <div className="sticky top-[70px] z-30 -mx-4 border-b border-neutral-200 bg-white/95 px-4 backdrop-blur-md sm:-mx-8 sm:px-8 dark:border-neutral-800 dark:bg-neutral-950/95">
        <div className="flex items-center justify-between gap-4">
          <nav className="flex min-w-0 gap-5 overflow-x-auto sm:gap-8">
            {tabs.map((tab) => (
              <a
                key={tab.href}
                href={tab.href}
                className="whitespace-nowrap border-b-2 border-transparent py-4 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500 transition-colors hover:border-gold hover:text-ink dark:text-neutral-400 dark:hover:text-white"
              >
                {tab.label}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-4 sm:gap-5">
            <ShareButton label={dict.common.share} />
            <FavoriteButton
              variant="inline"
              propertyId={property.id}
              locale={locale}
              labels={dict.favorite}
            />
          </div>
        </div>
      </div>

      {/* 2. 標頭：徽章 / List Price / 標題 / 地址 */}
      <header className="py-8 sm:py-10">
        {(isPublished || isFresh) && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {isPublished && (
              <span className={`${badgeClass} bg-emerald-800 text-white`}>
                {dict.listings.activeBadge}
              </span>
            )}
            {isFresh && (
              <span className={`${badgeClass} bg-gold text-white`}>
                {dict.listings.newBadge}
              </span>
            )}
          </div>
        )}
        <p className="eyebrow">{p.listPrice}</p>
        <p className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
          ${priceNumber.toLocaleString(locale)}
          <span className="ml-2 text-sm font-normal tracking-normal text-neutral-400">
            {property.currency}
          </span>
        </p>
        <h1 className="mt-4 font-display text-2xl text-neutral-800 sm:text-3xl dark:text-neutral-100">
          {property.title}
        </h1>
        <p className="mt-2 text-sm uppercase tracking-[0.08em] text-neutral-500">
          {property.address ? `${property.address}, ` : ''}
          {property.city}
          {property.district ? ` · ${property.district}` : ''}
        </p>
      </header>

      {/* 3. 大圖 gallery */}
      {galleryImages.length > 0 && <PropertyGallery images={galleryImages} />}

      {/* 4. 統計列 */}
      <div className="mt-8 grid grid-cols-2 gap-px border border-neutral-200 bg-neutral-200 sm:grid-cols-4 dark:border-neutral-800 dark:bg-neutral-800">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white px-4 py-6 text-center dark:bg-neutral-950"
          >
            <p className="font-display text-2xl sm:text-3xl">{stat.value}</p>
            <p className="mt-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-neutral-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
        <div className="min-w-0 space-y-14">
          {/* 5. #details：About This Property + Property Features */}
          <Reveal>
            <section id="details" className="scroll-mt-36">
              <h2 className="font-display text-2xl sm:text-3xl">{p.aboutTitle}</h2>
              <div className="gold-rule mt-4" />
              {property.description && (
                <p className="mt-6 whitespace-pre-line leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {property.description}
                </p>
              )}

              <h2 className="mt-12 font-display text-2xl sm:text-3xl">
                {p.featuresTitle}
              </h2>
              <div className="gold-rule mt-4" />
              <div className="mt-8">
                <FeatureGrid groups={featureGroups} />
              </div>
            </section>
          </Reveal>

          {/* 6. 外部影片 / 3D 導覽（點擊計數） */}
          {embeds.length > 0 && (
            <Reveal>
              <section className="flex flex-col gap-4">
                {embeds.map((media) => (
                  <EmbedFrame
                    key={media.id}
                    mediaId={media.id}
                    url={media.external_url!}
                    label={media.type === 'tour_3d' ? p.tour3d : p.videoTour}
                  />
                ))}
              </section>
            </Reveal>
          )}

          {/* 7. #map：物件位置 */}
          {hasMap && (
            <Reveal>
              <section id="map" className="scroll-mt-36">
                <h2 className="font-display text-2xl sm:text-3xl">{p.tabMap}</h2>
                <div className="gold-rule mt-4" />
                <div className="mt-6 overflow-hidden border border-neutral-200 dark:border-neutral-800">
                  <PropertyMap
                    lat={property.lat!}
                    lng={property.lng!}
                    price={priceNumber}
                  />
                </div>
              </section>
            </Reveal>
          )}

          {/* 8. #exclusive：獨家數據（深色區塊突顯差異化） */}
          <Reveal>
            <section
              id="exclusive"
              className="scroll-mt-36 bg-ink px-6 py-10 text-white sm:px-10 sm:py-12"
            >
              <h2 className="font-display text-2xl sm:text-3xl">{p.exclusiveTitle}</h2>
              <div className="gold-rule mt-4" />
              <p className="mt-4 text-sm text-white/60">{p.exclusiveHint}</p>
              <dl className="mt-6 grid gap-x-12 sm:grid-cols-2">
                {exclusiveRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-6 border-b border-white/10 py-3 text-sm"
                  >
                    <dt className="shrink-0 text-white/55">{row.label}</dt>
                    <dd className="text-right">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </Reveal>

          {/* 9. #mortgage：房貸試算 */}
          <Reveal>
            <section id="mortgage" className="scroll-mt-36">
              <MortgageCalculator
                locale={locale}
                initialPrice={priceNumber}
                labels={dict.property}
              />
            </section>
          </Reveal>
        </div>

        {/* 10. 右欄 agent 名片卡（單一 agent 品牌：連到 /about，不再有 /agents/*） */}
        <aside className="lg:sticky lg:top-40 lg:self-start">
          <section className={cardClass}>
            <p className="eyebrow">{p.listedBy}</p>
            {agent && (
              <>
                <Link
                  href={`/${locale}/about`}
                  className="mt-5 flex items-center gap-4 transition-opacity hover:opacity-80"
                >
                  {agent.avatar_url && (
                    // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 遠端圖
                    <img
                      src={agent.avatar_url}
                      alt={agent.display_name ?? agent.full_name ?? ''}
                      className="size-16 rounded-full object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg">
                      {agent.display_name ?? agent.full_name}
                    </p>
                  </div>
                </Link>
                {agent.phone && (
                  <a
                    href={`tel:${agent.phone}`}
                    className="mt-4 block text-sm transition-colors hover:text-gold"
                  >
                    <span className="text-neutral-500">{dict.common.contactAgent}</span>
                    <span className="mt-0.5 block font-medium">{agent.phone}</span>
                  </a>
                )}
              </>
            )}
            <Link href={inquireHref} className={`${btn.primary} mt-6 w-full`}>
              {p.inquire}
            </Link>
          </section>
        </aside>
      </div>

      {/* 11. 返回搜尋 */}
      <div className="mt-14">
        <Link
          href={`/${locale}/search`}
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 transition-colors hover:text-gold"
        >
          <IconChevronLeft size={16} aria-hidden /> {p.backToListings}
        </Link>
      </div>
    </main>
  );
}
