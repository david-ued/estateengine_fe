import { notFound } from 'next/navigation';
import { EmbedFrame } from '@/components/property/embed-frame';
import { MortgageCalculator } from '@/components/property/mortgage-calculator';
import { ViewTracker } from '@/components/property/view-tracker';
import { Reveal } from '@/components/reveal';
import { isLocale } from '@/i18n/config';
import { getDictionary, type Dictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';
import { externalMedia, storagePublicUrl } from '@/lib/media';
import type { Property } from '@/lib/types';

async function fetchProperty(id: string): Promise<Property | null> {
  try {
    return await apiFetch<Property>(`/properties/${id}`, { cache: 'no-store' });
  } catch {
    return null;
  }
}

function Stars({ count }: Readonly<{ count: number }>) {
  return <span className="text-amber-500">{'★'.repeat(count)}</span>;
}

export default async function PropertyDetailPage({
  params,
}: Readonly<{ params: Promise<{ locale: string; id: string }> }>) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const [dict, property] = await Promise.all([getDictionary(locale), fetchProperty(id)]);
  if (!property) notFound();

  const form = dict.agentForm;
  const images = (property.media ?? [])
    .filter(
      (m) =>
        (m.type === 'image' || m.type === 'virtual_staging_image') && m.storage_path,
    )
    .sort((a, b) => a.sort_order - b.sort_order);
  const embeds = externalMedia(property);
  const agent = property.agent;

  // 獨家數據：只顯示有填的欄位
  const exclusiveRows: { label: string; value: React.ReactNode }[] = [];
  if (property.school_district)
    exclusiveRows.push({ label: form.schoolDistrict, value: property.school_district });
  if (property.transit_notes)
    exclusiveRows.push({ label: form.transitNotes, value: property.transit_notes });
  if (property.flood_zone)
    exclusiveRows.push({ label: form.floodZone, value: '⚠️' });
  if (property.terrain_notes)
    exclusiveRows.push({ label: form.terrainNotes, value: property.terrain_notes });
  if (property.feng_shui_orientation)
    exclusiveRows.push({
      label: form.fengShuiOrientation,
      value:
        form.orientations[
          property.feng_shui_orientation as keyof Dictionary['agentForm']['orientations']
        ] ?? property.feng_shui_orientation,
    });
  if (property.feng_shui_notes)
    exclusiveRows.push({ label: form.fengShuiNotes, value: property.feng_shui_notes });
  if (property.builder_name)
    exclusiveRows.push({ label: form.builderName, value: property.builder_name });
  if (property.builder_reputation)
    exclusiveRows.push({
      label: form.builderReputation,
      value: <Stars count={property.builder_reputation} />,
    });
  if (property.material_grade)
    exclusiveRows.push({
      label: form.materialGrade,
      value: <Stars count={property.material_grade} />,
    });
  if (property.basement_status !== 'none')
    exclusiveRows.push({
      label: form.basementStatus,
      value: form.basementOptions[property.basement_status],
    });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-8">
      <ViewTracker propertyId={property.id} />

      <header className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-2xl font-bold">{property.title}</h1>
          <span className="font-mono text-xl">
            ${Number(property.price).toLocaleString()} {property.currency}
          </span>
        </div>
        <p className="mt-1 text-neutral-500">
          {property.city}
          {property.district ? ` · ${property.district}` : ''}
          {property.address ? ` · ${property.address}` : ''}
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          {Number(property.area_sqft).toLocaleString()} {dict.filters.sqft} ·{' '}
          {property.beds} {dict.filters.beds} / {property.baths} {dict.filters.baths}
        </p>
      </header>

      {/* 照片：首圖放大營造主視覺層次 */}
      {images.length > 0 && (
        <section className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {images.slice(0, 5).map((image, index) => (
            <div
              key={image.id}
              className={`fade-up overflow-hidden rounded-lg ${
                index === 0 ? 'col-span-2 row-span-2' : ''
              }`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 遠端圖 */}
              <img
                src={storagePublicUrl(image.storage_path!)}
                alt={property.title}
                className={`size-full object-cover transition duration-500 ease-out hover:scale-[1.04] ${
                  index === 0 ? 'aspect-square sm:aspect-[4/3]' : 'aspect-[4/3]'
                }`}
              />
            </div>
          ))}
        </section>
      )}

      {/* 外部影片 / 3D 導覽（點擊計數） */}
      {embeds.length > 0 && (
        <Reveal className="mb-6">
          <section className="flex flex-col gap-4">
            {embeds.map((media) => (
              <EmbedFrame
                key={media.id}
                mediaId={media.id}
                url={media.external_url!}
                label={
                  media.type === 'tour_3d' ? dict.property.tour3d : dict.property.videoTour
                }
              />
            ))}
          </section>
        </Reveal>
      )}

      {property.description && (
        <Reveal className="mb-6">
          <p className="whitespace-pre-line text-neutral-700 dark:text-neutral-300">
            {property.description}
          </p>
        </Reveal>
      )}

      {/* 獨家數據（MLS 沒有的專業細節） */}
      {exclusiveRows.length > 0 && (
        <Reveal className="mb-6">
          <section className="card-lift rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
            <h2 className="mb-3 font-semibold">{dict.property.exclusiveTitle}</h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {exclusiveRows.map((row) => (
                <div key={row.label} className="flex justify-between gap-4">
                  <dt className="text-neutral-500">{row.label}</dt>
                  <dd className="text-right">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </Reveal>
      )}

      <Reveal>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* 專屬房仲名片（Marketing：點選房屋帶出房仲介紹） */}
        {agent && (
          <section className="card-lift rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
            <h2 className="text-xs uppercase tracking-wide text-neutral-500">
              {dict.property.listedBy}
            </h2>
            <p className="mt-2 font-semibold">
              {agent.display_name ?? agent.full_name}
            </p>
            {agent.agency_name && (
              <p className="text-sm text-neutral-500">{agent.agency_name}</p>
            )}
            {agent.bio && (
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                {agent.bio}
              </p>
            )}
            {agent.phone && (
              <a
                href={`tel:${agent.phone}`}
                className="mt-4 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
              >
                {dict.common.contactAgent}
              </a>
            )}
          </section>
        )}

        <MortgageCalculator
          initialPrice={Number(property.price)}
          labels={dict.property}
        />
      </div>
      </Reveal>
    </main>
  );
}
