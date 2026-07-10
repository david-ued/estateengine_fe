'use client';

import {
  IconAdjustmentsHorizontal,
  IconBath,
  IconBed,
  IconBuildingHospital,
  IconBuildingStore,
  IconCash,
  IconCompass,
  IconHome,
  IconMapPin,
  IconRulerMeasure,
  IconSchool,
  IconStar,
  IconTrain,
  IconTrees,
  IconWall,
  IconX,
} from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { Dictionary } from '@/i18n/get-dictionary';
import { AMENITIES, CITIES, ORIENTATIONS, PROPERTY_TYPES, type Amenity } from '@/lib/constants';
import { DualRange } from '@/components/ui/dual-range';
import { btn } from '@/components/ui/styles';

const AMENITY_ICONS = {
  superstore: IconBuildingStore,
  transit_station: IconTrain,
  park: IconTrees,
  hospital: IconBuildingHospital,
} as const;

// 快速預設區間（點了即套用，滑桿可再精調）
const PRICE_PRESETS: [number, number][] = [
  [0, 500_000],
  [500_000, 750_000],
  [750_000, 1_000_000],
  [1_000_000, 1_500_000],
  [1_500_000, 3_000_000],
];

const SQFT_PRESETS: [number, number][] = [
  [0, 800],
  [800, 1_200],
  [1_200, 2_000],
  [2_000, 5_000],
];

// 學區段位（小白友善：不用拖數字）
const SCHOOL_TIERS = [80, 60, 40] as const;

const PRICE_MIN = 0;
const PRICE_MAX = 3_000_000;
const PRICE_STEP = 25_000;
const SQFT_MIN = 0;
const SQFT_MAX = 5_000;
const SQFT_STEP = 50;

export interface ListingFilters {
  city?: string;
  minPrice?: string;
  maxPrice?: string;
  minSqft?: string;
  maxSqft?: string;
  beds?: string;
  baths?: string;
  propertyType?: string;
  minSchool?: string;
  minBuilder?: string;
  minMaterial?: string;
  orientation?: string;
  amenities?: string;
  sort?: string;
}

interface FilterState {
  city: string;
  priceLow: number;
  priceHigh: number;
  sqftLow: number;
  sqftHigh: number;
  beds: string;
  baths: string;
  propertyType: string;
  minSchool: number;
  minBuilder: number;
  minMaterial: number;
  orientation: string;
  amenities: Amenity[];
}

function fromDefaults(defaults: ListingFilters): FilterState {
  return {
    city: defaults.city ?? '',
    priceLow: Number(defaults.minPrice ?? PRICE_MIN),
    priceHigh: Number(defaults.maxPrice ?? PRICE_MAX),
    sqftLow: Number(defaults.minSqft ?? SQFT_MIN),
    sqftHigh: Number(defaults.maxSqft ?? SQFT_MAX),
    beds: defaults.beds ?? '',
    baths: defaults.baths ?? '',
    propertyType: defaults.propertyType ?? '',
    minSchool: Number(defaults.minSchool ?? 0),
    minBuilder: Number(defaults.minBuilder ?? 0),
    minMaterial: Number(defaults.minMaterial ?? 0),
    orientation: defaults.orientation ?? '',
    amenities: (defaults.amenities?.split(',') ?? []).filter((key): key is Amenity =>
      (AMENITIES as readonly string[]).includes(key),
    ),
  };
}

const chip = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm transition ${
    active
      ? 'border-brand bg-brand font-medium text-white'
      : 'border-neutral-300 text-neutral-600 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-300'
  }`;

const sectionTitle =
  'mb-2 flex items-center gap-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-100';

export function FilterBar({
  locale,
  labels,
  common,
  orientations,
  propertyTypes,
  amenityLabels,
  defaults,
}: Readonly<{
  locale: string;
  labels: Dictionary['filters'];
  common: Pick<Dictionary['common'], 'close'>;
  orientations: Dictionary['agentForm']['orientations'];
  propertyTypes: Dictionary['agentForm']['propertyTypes'];
  amenityLabels: Dictionary['agentForm']['amenityOptions'];
  defaults: ListingFilters;
}>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FilterState>(() => fromDefaults(defaults));

  const patch = (partial: Partial<FilterState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  const fmtPrice = (v: number) =>
    v >= PRICE_MAX ? `$${PRICE_MAX / 1_000_000}M+` : `$${(v / 1000).toLocaleString(locale)}K`;
  const fmtSqft = (v: number) => (v >= SQFT_MAX ? `${SQFT_MAX}+` : String(v));

  function apply() {
    const params = new URLSearchParams();
    if (state.city) params.set('city', state.city);
    if (state.priceLow > PRICE_MIN) params.set('minPrice', String(state.priceLow));
    if (state.priceHigh < PRICE_MAX) params.set('maxPrice', String(state.priceHigh));
    if (state.sqftLow > SQFT_MIN) params.set('minSqft', String(state.sqftLow));
    if (state.sqftHigh < SQFT_MAX) params.set('maxSqft', String(state.sqftHigh));
    if (state.beds) params.set('beds', state.beds);
    if (state.baths) params.set('baths', state.baths);
    if (state.propertyType) params.set('propertyType', state.propertyType);
    if (state.minSchool > 0) params.set('minSchool', String(state.minSchool));
    if (state.minBuilder > 0) params.set('minBuilder', String(state.minBuilder));
    if (state.minMaterial > 0) params.set('minMaterial', String(state.minMaterial));
    if (state.orientation) params.set('orientation', state.orientation);
    if (state.amenities.length > 0) params.set('amenities', state.amenities.join(','));

    const sort = searchParams.get('sort');
    if (sort) params.set('sort', sort);

    setOpen(false);
    const query = params.toString();
    router.push(`/${locale}/properties${query ? `?${query}` : ''}`);
  }

  function reset() {
    setState(fromDefaults({}));
  }

  const activeCount = [
    state.city,
    state.priceLow > PRICE_MIN || state.priceHigh < PRICE_MAX,
    state.sqftLow > SQFT_MIN || state.sqftHigh < SQFT_MAX,
    state.beds,
    state.baths,
    state.propertyType,
    state.minSchool > 0,
    state.minBuilder > 0,
    state.minMaterial > 0,
    state.orientation,
    state.amenities.length > 0,
  ].filter(Boolean).length;

  return (
    <>
      {/* 觸發列：城市快選 + 篩選按鈕 */}
      <div className="flex flex-wrap items-center gap-2">
        <IconMapPin size={18} className="text-neutral-400" />
        {CITIES.map((city) => (
          <button
            key={city}
            type="button"
            className={chip(state.city === city)}
            onClick={() => {
              const next = state.city === city ? '' : city;
              patch({ city: next });
              const params = new URLSearchParams(searchParams.toString());
              if (next) params.set('city', next);
              else params.delete('city');
              params.delete('page');
              router.push(`/${locale}/properties?${params.toString()}`);
            }}
          >
            {city}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ml-auto flex items-center gap-1.5 rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium transition hover:border-neutral-500 hover:shadow-sm dark:border-neutral-700"
        >
          <IconAdjustmentsHorizontal size={16} />
          {labels.title}
          {activeCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* 篩選彈窗（手機全螢幕 / 桌機置中卡片） */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center sm:p-6">
          <div className="flex max-h-[92dvh] w-full flex-col overflow-hidden bg-white sm:max-w-xl sm:rounded-2xl sm:shadow-2xl dark:bg-neutral-950">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <h2 className="font-semibold">{labels.title}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={common.close}
                className="rounded-full p-1.5 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-6 overflow-y-auto px-5 py-5">
              {/* 價格區間：快速預設 + 滑桿精調 */}
              <section>
                <h3 className={sectionTitle}>
                  <IconCash size={18} className="text-brand" /> {labels.price}
                </h3>
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={chip(state.priceLow === PRICE_MIN && state.priceHigh === PRICE_MAX)}
                    onClick={() => patch({ priceLow: PRICE_MIN, priceHigh: PRICE_MAX })}
                  >
                    {labels.any}
                  </button>
                  {PRICE_PRESETS.map(([low, high]) => (
                    <button
                      key={`${low}-${high}`}
                      type="button"
                      className={chip(state.priceLow === low && state.priceHigh === high)}
                      onClick={() => patch({ priceLow: low, priceHigh: high })}
                    >
                      {low === PRICE_MIN
                        ? `≤ ${fmtPrice(high)}`
                        : high === PRICE_MAX
                          ? `${fmtPrice(low)}+`
                          : `${fmtPrice(low)}–${fmtPrice(high)}`}
                    </button>
                  ))}
                </div>
                <DualRange
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  low={state.priceLow}
                  high={state.priceHigh}
                  onChange={(low, high) => patch({ priceLow: low, priceHigh: high })}
                  format={fmtPrice}
                  minLabel={labels.min}
                  maxLabel={labels.max}
                />
              </section>

              {/* 坪數區間：快速預設 + 滑桿精調 */}
              <section>
                <h3 className={sectionTitle}>
                  <IconRulerMeasure size={18} className="text-brand" /> {labels.sqft}
                </h3>
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={chip(state.sqftLow === SQFT_MIN && state.sqftHigh === SQFT_MAX)}
                    onClick={() => patch({ sqftLow: SQFT_MIN, sqftHigh: SQFT_MAX })}
                  >
                    {labels.any}
                  </button>
                  {SQFT_PRESETS.map(([low, high]) => (
                    <button
                      key={`${low}-${high}`}
                      type="button"
                      className={chip(state.sqftLow === low && state.sqftHigh === high)}
                      onClick={() => patch({ sqftLow: low, sqftHigh: high })}
                    >
                      {low === SQFT_MIN
                        ? `≤ ${high}`
                        : high === SQFT_MAX
                          ? `${low.toLocaleString(locale)}+`
                          : `${low.toLocaleString(locale)}–${high.toLocaleString(locale)}`}
                    </button>
                  ))}
                </div>
                <DualRange
                  min={SQFT_MIN}
                  max={SQFT_MAX}
                  step={SQFT_STEP}
                  low={state.sqftLow}
                  high={state.sqftHigh}
                  onChange={(low, high) => patch({ sqftLow: low, sqftHigh: high })}
                  format={fmtSqft}
                  minLabel={labels.min}
                  maxLabel={labels.max}
                />
              </section>

              {/* 房 / 衛 */}
              <section>
                <h3 className={sectionTitle}>
                  <IconBed size={18} className="text-brand" /> {labels.beds}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['', '1', '2', '3', '4', '5'].map((value) => (
                    <button
                      key={value || 'any'}
                      type="button"
                      className={chip(state.beds === value)}
                      onClick={() => patch({ beds: value })}
                    >
                      {value === '' ? labels.any : value === '5' ? '5+' : value}
                    </button>
                  ))}
                </div>
              </section>
              <section>
                <h3 className={sectionTitle}>
                  <IconBath size={18} className="text-brand" /> {labels.baths}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['', '1', '2', '3', '4'].map((value) => (
                    <button
                      key={value || 'any'}
                      type="button"
                      className={chip(state.baths === value)}
                      onClick={() => patch({ baths: value })}
                    >
                      {value === '' ? labels.any : value === '4' ? '4+' : value}
                    </button>
                  ))}
                </div>
              </section>

              {/* 房屋類型 */}
              <section>
                <h3 className={sectionTitle}>
                  <IconHome size={18} className="text-brand" /> {labels.propertyType}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={chip(state.propertyType === '')}
                    onClick={() => patch({ propertyType: '' })}
                  >
                    {labels.any}
                  </button>
                  {PROPERTY_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={chip(state.propertyType === type)}
                      onClick={() => patch({ propertyType: type })}
                    >
                      {propertyTypes[type]}
                    </button>
                  ))}
                </div>
              </section>

              {/* 獨家進階篩選 */}
              <section className="rounded-xl border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                <h3 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                  ✨ {labels.advancedTitle}
                </h3>
                <div className="flex flex-col gap-4">
                  <div>
                    <h4 className={sectionTitle}>
                      <IconSchool size={18} className="text-accent" /> {labels.schoolRank}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={chip(state.minSchool === 0)}
                        onClick={() => patch({ minSchool: 0 })}
                      >
                        {labels.any}
                      </button>
                      {SCHOOL_TIERS.map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          className={chip(state.minSchool === tier)}
                          onClick={() => patch({ minSchool: tier })}
                        >
                          {tier === 80
                            ? labels.schoolTop
                            : tier === 60
                              ? labels.schoolGreat
                              : labels.schoolMid}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(
                    [
                      ['minBuilder', labels.builderQuality, IconStar],
                      ['minMaterial', labels.materialGrade, IconWall],
                    ] as const
                  ).map(([key, label, Icon]) => (
                    <div key={key}>
                      <h4 className={sectionTitle}>
                        <Icon size={18} className="text-accent" /> {label}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={chip(state[key] === 0)}
                          onClick={() => patch({ [key]: 0 })}
                        >
                          {labels.any}
                        </button>
                        {[1, 2, 3, 4, 5].map((grade) => (
                          <button
                            key={grade}
                            type="button"
                            className={chip(state[key] === grade)}
                            onClick={() => patch({ [key]: grade })}
                            aria-label={grade === 5 ? '5 / 5' : `${grade}+ / 5`}
                          >
                            <span aria-hidden="true">
                              {grade}★{grade < 5 ? '+' : ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div>
                    <h4 className={sectionTitle}>
                      <IconCompass size={18} className="text-accent" /> {labels.fengShui}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={chip(state.orientation === '')}
                        onClick={() => patch({ orientation: '' })}
                      >
                        {labels.any}
                      </button>
                      {ORIENTATIONS.map((orientation) => (
                        <button
                          key={orientation}
                          type="button"
                          className={chip(state.orientation === orientation)}
                          onClick={() => patch({ orientation })}
                        >
                          {orientations[orientation]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 生活機能：多選 toggle chips */}
                  <div>
                    <h4 className={sectionTitle}>
                      <IconBuildingStore size={18} className="text-accent" /> {labels.amenities}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {AMENITIES.map((amenity) => {
                        const Icon = AMENITY_ICONS[amenity];
                        const active = state.amenities.includes(amenity);
                        return (
                          <button
                            key={amenity}
                            type="button"
                            className={`${chip(active)} inline-flex items-center gap-1.5`}
                            onClick={() =>
                              patch({
                                amenities: active
                                  ? state.amenities.filter((a) => a !== amenity)
                                  : [...state.amenities, amenity],
                              })
                            }
                          >
                            <Icon size={15} />
                            {amenityLabels[amenity]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <button
                type="button"
                onClick={reset}
                className="text-sm font-medium text-neutral-500 underline transition hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                {labels.reset}
              </button>
              <button type="button" onClick={apply} className={`${btn.primary} px-6`}>
                {labels.apply}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
