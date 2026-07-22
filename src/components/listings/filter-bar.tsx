'use client';

import {
  IconAdjustmentsHorizontal,
  IconBath,
  IconBed,
  IconBuildingHospital,
  IconBuildingStore,
  IconCash,
  IconChevronDown,
  IconCompass,
  IconHome,
  IconPaw,
  IconRulerMeasure,
  IconSchool,
  IconStar,
  IconTrain,
  IconTrees,
  IconWall,
  IconX,
} from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DualRange } from '@/components/ui/dual-range';
import { btn, selectClass } from '@/components/ui/styles';
import type { Dictionary } from '@/i18n/get-dictionary';
import {
  AMENITIES,
  CITIES,
  ORIENTATIONS,
  PERSONAS,
  PROPERTY_TYPES,
  type Amenity,
  type PersonaPreset,
} from '@/lib/constants';

const AMENITY_ICONS = {
  superstore: IconBuildingStore,
  transit_station: IconTrain,
  park: IconTrees,
  hospital: IconBuildingHospital,
} as const;

// 快速預設區間（點了即帶入，滑桿可再精調）
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
  petsAllowed?: string;
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
  /** 寵物三態：'' 不限 / 'true' 可養 / 'false' 不可養 */
  petsAllowed: '' | 'true' | 'false';
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
    petsAllowed:
      defaults.petsAllowed === 'true' || defaults.petsAllowed === 'false'
        ? defaults.petsAllowed
        : '',
  };
}

/** filter bar 觸發鈕：白底細框、全大寫寬字距，啟用中轉金（黑白金風格） */
const barBtn = (active: boolean) =>
  `press inline-flex h-10 items-center gap-1.5 border bg-white px-4 text-xs font-semibold uppercase tracking-[0.14em] transition-colors dark:bg-neutral-950 ${
    active
      ? 'border-gold text-gold'
      : 'border-neutral-300 text-neutral-700 hover:border-gold hover:text-gold dark:border-neutral-700 dark:text-neutral-200'
  }`;

/** 面板內選項 chip：方角、選中金底 */
const chip = (active: boolean) =>
  `border px-3.5 py-1.5 text-sm transition ${
    active
      ? 'border-gold bg-gold font-medium text-white'
      : 'border-neutral-300 text-neutral-600 hover:border-gold hover:text-gold dark:border-neutral-700 dark:text-neutral-300'
  }`;

const sectionTitle =
  'mb-2 flex items-center gap-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-100';

/** Persona 預設 → 篩選檔位（未指定的欄位重設為不限；只是帶入 preset，非權重排序） */
function personaToState(preset: PersonaPreset): Partial<FilterState> {
  return {
    priceLow: PRICE_MIN,
    priceHigh: preset.maxPrice ?? PRICE_MAX,
    minSchool: preset.minSchool ?? 0,
    minBuilder: preset.minBuilder ?? 0,
    minMaterial: preset.minMaterial ?? 0,
    orientation: preset.orientation ?? '',
    amenities: [...(preset.amenities ?? [])],
  };
}

function personaActive(state: FilterState, preset: PersonaPreset): boolean {
  const target = personaToState(preset);
  return (
    state.priceHigh === target.priceHigh &&
    state.minSchool === target.minSchool &&
    state.minBuilder === target.minBuilder &&
    state.minMaterial === target.minMaterial &&
    state.orientation === target.orientation &&
    state.amenities.length === target.amenities!.length &&
    state.amenities.every((a) => target.amenities!.includes(a))
  );
}

/** 篩選草稿狀態 + 套用/重設（apply 寫回 /search 的 URL query，沿用既有參數命名） */
function useListingFilters(locale: string, defaults: ListingFilters) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<FilterState>(() => fromDefaults(defaults));

  const patch = (partial: Partial<FilterState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  /** 帶 overrides 可在同一個事件內「patch + 立即套用」（setState 是非同步的） */
  function apply(overrides?: Partial<FilterState>) {
    const s = { ...state, ...overrides };
    const params = new URLSearchParams();
    if (s.city) params.set('city', s.city);
    if (s.priceLow > PRICE_MIN) params.set('minPrice', String(s.priceLow));
    if (s.priceHigh < PRICE_MAX) params.set('maxPrice', String(s.priceHigh));
    if (s.sqftLow > SQFT_MIN) params.set('minSqft', String(s.sqftLow));
    if (s.sqftHigh < SQFT_MAX) params.set('maxSqft', String(s.sqftHigh));
    if (s.beds) params.set('beds', s.beds);
    if (s.baths) params.set('baths', s.baths);
    if (s.propertyType) params.set('propertyType', s.propertyType);
    if (s.minSchool > 0) params.set('minSchool', String(s.minSchool));
    if (s.minBuilder > 0) params.set('minBuilder', String(s.minBuilder));
    if (s.minMaterial > 0) params.set('minMaterial', String(s.minMaterial));
    if (s.orientation) params.set('orientation', s.orientation);
    if (s.amenities.length > 0) params.set('amenities', s.amenities.join(','));
    if (s.petsAllowed) params.set('petsAllowed', s.petsAllowed);

    // 排序另由 SortSelect 管理，套用篩選時保留；分頁則重設回第 1 頁
    const sort = searchParams.get('sort');
    if (sort) params.set('sort', sort);

    const query = params.toString();
    router.push(`/${locale}/search${query ? `?${query}` : ''}`);
  }

  const reset = () => setState(fromDefaults({}));

  const priceActive = state.priceLow > PRICE_MIN || state.priceHigh < PRICE_MAX;
  const sqftActive = state.sqftLow > SQFT_MIN || state.sqftHigh < SQFT_MAX;

  // 「更多條件」按鈕的計數：獨家進階條件 + 面積（不含頂列已有的城市/價格/房衛/類型）
  const advancedCount = [
    sqftActive,
    state.minSchool > 0,
    state.minBuilder > 0,
    state.minMaterial > 0,
    state.orientation !== '',
    state.amenities.length > 0,
    state.petsAllowed !== '',
  ].filter(Boolean).length;

  const activeCount =
    advancedCount +
    [state.city, priceActive, state.beds, state.baths, state.propertyType].filter(Boolean)
      .length;

  return { state, patch, apply, reset, priceActive, advancedCount, activeCount };
}

// ---------------------------------------------------------------------------
// 篩選區塊（下拉面板與彈窗共用）
// ---------------------------------------------------------------------------

interface SectionProps {
  state: FilterState;
  patch: (partial: Partial<FilterState>) => void;
  labels: Dictionary['filters'];
}

function fmtPriceFactory(locale: string) {
  return (v: number) =>
    v >= PRICE_MAX ? `$${PRICE_MAX / 1_000_000}M+` : `$${(v / 1000).toLocaleString(locale)}K`;
}

function PriceSection({
  locale,
  state,
  patch,
  labels,
}: Readonly<SectionProps & { locale: string }>) {
  const fmtPrice = fmtPriceFactory(locale);
  return (
    <section>
      <h3 className={sectionTitle}>
        <IconCash size={18} className="text-gold" /> {labels.price}
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
  );
}

function SqftSection({
  locale,
  state,
  patch,
  labels,
}: Readonly<SectionProps & { locale: string }>) {
  const fmtSqft = (v: number) => (v >= SQFT_MAX ? `${SQFT_MAX}+` : String(v));
  return (
    <section>
      <h3 className={sectionTitle}>
        <IconRulerMeasure size={18} className="text-gold" /> {labels.sqft}
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
  );
}

function RoomsSection({ state, patch, labels }: Readonly<SectionProps>) {
  return (
    <>
      <section>
        <h3 className={sectionTitle}>
          <IconBed size={18} className="text-gold" /> {labels.beds}
        </h3>
        <div className="flex flex-wrap gap-2">
          {['', '1', '2', '3', '4', '5'].map((value) => (
            <button
              key={value || 'any'}
              type="button"
              className={chip(state.beds === value)}
              onClick={() => patch({ beds: value })}
            >
              {value === '' ? labels.any : `${value}+`}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3 className={sectionTitle}>
          <IconBath size={18} className="text-gold" /> {labels.baths}
        </h3>
        <div className="flex flex-wrap gap-2">
          {['', '1', '2', '3', '4'].map((value) => (
            <button
              key={value || 'any'}
              type="button"
              className={chip(state.baths === value)}
              onClick={() => patch({ baths: value })}
            >
              {value === '' ? labels.any : `${value}+`}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function TypeSection({
  state,
  patch,
  labels,
  propertyTypes,
}: Readonly<SectionProps & { propertyTypes: Dictionary['agentForm']['propertyTypes'] }>) {
  return (
    <section>
      <h3 className={sectionTitle}>
        <IconHome size={18} className="text-gold" /> {labels.propertyType}
      </h3>
      {/* BE 的 propertyType 是單值 eq 過濾，故維持單選（點同一項可取消） */}
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
            onClick={() => patch({ propertyType: state.propertyType === type ? '' : type })}
          >
            {propertyTypes[type]}
          </button>
        ))}
      </div>
    </section>
  );
}

function PersonaSection({
  state,
  patch,
  personas,
  personaCopy,
}: Readonly<{
  state: FilterState;
  patch: (partial: Partial<FilterState>) => void;
  personas: Dictionary['personas'];
  personaCopy: Pick<Dictionary['weights'], 'personaTitle' | 'personaHint'>;
}>) {
  return (
    <section className="border border-gold/30 bg-gold/5 p-3">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {personaCopy.personaTitle}
      </h3>
      <p className="mb-2.5 mt-0.5 text-xs text-neutral-500">{personaCopy.personaHint}</p>
      <div className="grid grid-cols-3 gap-2">
        {PERSONAS.map((persona) => {
          const active = personaActive(state, persona.preset);
          return (
            <button
              key={persona.code}
              type="button"
              aria-pressed={active}
              onClick={() => patch(personaToState(persona.preset))}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 border px-1 py-2 transition ${
                active
                  ? 'border-gold bg-gold text-white shadow-md'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:border-gold hover:bg-gold/5 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-200'
              }`}
            >
              <span className="text-xl leading-none">{persona.icon}</span>
              <span className="text-center text-xs font-medium leading-tight">
                {personas[persona.code]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AdvancedSection({
  state,
  patch,
  labels,
  orientations,
  amenityLabels,
}: Readonly<
  SectionProps & {
    orientations: Dictionary['agentForm']['orientations'];
    amenityLabels: Dictionary['agentForm']['amenityOptions'];
  }
>) {
  return (
    <section className="border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
      <h3 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
        ✨ {labels.advancedTitle}
      </h3>
      <div className="flex flex-col gap-4">
        <div>
          <h4 className={sectionTitle}>
            <IconSchool size={18} className="text-gold" /> {labels.schoolRank}
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
              <Icon size={18} className="text-gold" /> {label}
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
            <IconCompass size={18} className="text-gold" /> {labels.fengShui}
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
            <IconBuildingStore size={18} className="text-gold" /> {labels.amenities}
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

        {/* 寵物：三態單選（不限 / 可養 / 不可養），對應 BE petsAllowed=true/false */}
        <div>
          <h4 className={sectionTitle}>
            <IconPaw size={18} className="text-gold" /> {labels.pets}
          </h4>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['', labels.any],
                ['true', labels.petsAllowed],
                ['false', labels.petsNotAllowed],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value || 'any'}
                type="button"
                className={chip(state.petsAllowed === value)}
                onClick={() => patch({ petsAllowed: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 下拉面板（桌機 filter bar 用）
// ---------------------------------------------------------------------------

function Dropdown({
  label,
  active,
  open,
  onToggle,
  onClose,
  widthClass = 'w-80',
  children,
}: Readonly<{
  label: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  widthClass?: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={onToggle}
        className={barBtn(active || open)}
      >
        {label}
        <IconChevronDown
          size={14}
          aria-hidden
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <>
          {/* 透明遮罩：點外側收合 */}
          <div className="fixed inset-0 z-10" onClick={onClose} aria-hidden="true" />
          <div
            className={`absolute left-0 top-full z-20 mt-2 ${widthClass} border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-950`}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

/** 下拉面板底部的重設 / 套用列 */
function PanelFooter({
  labels,
  onReset,
  onApply,
}: Readonly<{
  labels: Pick<Dictionary['filters'], 'reset' | 'apply'>;
  onReset: () => void;
  onApply: () => void;
}>) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onReset}
        className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500 underline-offset-4 transition-colors hover:text-gold hover:underline"
      >
        {labels.reset}
      </button>
      <button type="button" onClick={onApply} className={btn.primary}>
        {labels.apply}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FilterBar 主體
// ---------------------------------------------------------------------------

type PanelKey = 'price' | 'rooms' | 'type' | 'more' | 'mobile';

interface FilterBarProps {
  locale: string;
  labels: Dictionary['filters'];
  search: Pick<Dictionary['search'], 'anyPrice' | 'moreFilters'>;
  common: Pick<Dictionary['common'], 'close'>;
  orientations: Dictionary['agentForm']['orientations'];
  propertyTypes: Dictionary['agentForm']['propertyTypes'];
  amenityLabels: Dictionary['agentForm']['amenityOptions'];
  personas: Dictionary['personas'];
  personaCopy: Pick<Dictionary['weights'], 'personaTitle' | 'personaHint'>;
  defaults: ListingFilters;
  /** 右側動作區（如「儲存搜尋」按鈕） */
  children?: React.ReactNode;
}

/**
 * Search 頁頂部橫向篩選列（The BRAND search-mls 式）：
 * 白底 border-b、sticky 在 nav 下方；城市 select 立即套用，
 * 價格 / 房衛 / 類型為下拉面板，「更多條件」開獨家進階彈窗；
 * 手機縮成單一「篩選」按鈕（全螢幕彈窗）。
 */
export function FilterBar({
  locale,
  labels,
  search,
  common,
  orientations,
  propertyTypes,
  amenityLabels,
  personas,
  personaCopy,
  defaults,
  children,
}: Readonly<FilterBarProps>) {
  const { state, patch, apply, reset, priceActive, advancedCount, activeCount } =
    useListingFilters(locale, defaults);
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);

  // Esc 收合下拉 / 彈窗
  useEffect(() => {
    if (!openPanel) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenPanel(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openPanel]);

  const close = () => setOpenPanel(null);
  const toggle = (key: PanelKey) => setOpenPanel((prev) => (prev === key ? null : key));
  const applyAndClose = () => {
    close();
    apply();
  };

  const fmtPrice = fmtPriceFactory(locale);
  const priceLabel = priceActive
    ? state.priceLow > PRICE_MIN && state.priceHigh < PRICE_MAX
      ? `${fmtPrice(state.priceLow)}–${fmtPrice(state.priceHigh)}`
      : state.priceLow > PRICE_MIN
        ? `${fmtPrice(state.priceLow)}+`
        : `≤ ${fmtPrice(state.priceHigh)}`
    : search.anyPrice;

  const roomsActive = state.beds !== '' || state.baths !== '';
  const roomsLabel = roomsActive
    ? [
        state.beds && `${state.beds}+ ${labels.beds}`,
        state.baths && `${state.baths}+ ${labels.baths}`,
      ]
        .filter(Boolean)
        .join(' · ')
    : `${labels.beds} / ${labels.baths}`;

  const typeLabel = state.propertyType
    ? propertyTypes[state.propertyType as (typeof PROPERTY_TYPES)[number]]
    : labels.propertyType;

  const moreLabel = `${search.moreFilters}${advancedCount > 0 ? ` (${advancedCount})` : ''}`;

  // 「更多條件」在桌機是向下延展面板（不彈窗）；彈窗只剩手機全螢幕篩選
  const modalOpen = openPanel === 'mobile';

  return (
    <div className="sticky top-[60px] z-40 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      {/* top-[60px] = 導覽列高度（py-4 + text-lg 內容 ≈ 60px），讓 bar 貼齊 nav 底緣 */}
      <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center gap-2 px-4 py-3 sm:px-8">
        {/* 城市：select 立即套用 */}
        <label>
          <span className="sr-only">{labels.location}</span>
          <select
            value={state.city}
            onChange={(event) => {
              const city = event.target.value;
              patch({ city });
              apply({ city });
            }}
            className={`${selectClass} h-10 text-xs font-semibold uppercase tracking-[0.14em]`}
          >
            <option value="">
              {labels.location}: {labels.any}
            </option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        {/* 桌機：價格 / 房衛 / 類型下拉 + 更多條件 */}
        <div className="hidden items-center gap-2 md:flex">
          <Dropdown
            label={priceLabel}
            active={priceActive}
            open={openPanel === 'price'}
            onToggle={() => toggle('price')}
            onClose={close}
            widthClass="w-96"
          >
            <PriceSection locale={locale} state={state} patch={patch} labels={labels} />
            <PanelFooter
              labels={labels}
              onReset={() => patch({ priceLow: PRICE_MIN, priceHigh: PRICE_MAX })}
              onApply={applyAndClose}
            />
          </Dropdown>

          <Dropdown
            label={roomsLabel}
            active={roomsActive}
            open={openPanel === 'rooms'}
            onToggle={() => toggle('rooms')}
            onClose={close}
          >
            <div className="flex flex-col gap-4">
              <RoomsSection state={state} patch={patch} labels={labels} />
            </div>
            <PanelFooter
              labels={labels}
              onReset={() => patch({ beds: '', baths: '' })}
              onApply={applyAndClose}
            />
          </Dropdown>

          <Dropdown
            label={typeLabel}
            active={state.propertyType !== ''}
            open={openPanel === 'type'}
            onToggle={() => toggle('type')}
            onClose={close}
          >
            <TypeSection
              state={state}
              patch={patch}
              labels={labels}
              propertyTypes={propertyTypes}
            />
            <PanelFooter
              labels={labels}
              onReset={() => patch({ propertyType: '' })}
              onApply={applyAndClose}
            />
          </Dropdown>

          <button
            type="button"
            aria-expanded={openPanel === 'more'}
            onClick={() => toggle('more')}
            className={barBtn(advancedCount > 0 || openPanel === 'more')}
          >
            <IconAdjustmentsHorizontal size={15} aria-hidden />
            {moreLabel}
            <IconChevronDown
              size={14}
              aria-hidden
              className={`transition-transform ${openPanel === 'more' ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* 手機：單一「篩選」按鈕（全螢幕彈窗） */}
        <button
          type="button"
          onClick={() => toggle('mobile')}
          className={`${barBtn(activeCount > 0)} md:hidden`}
        >
          <IconAdjustmentsHorizontal size={15} aria-hidden />
          {labels.title}
          {activeCount > 0 && (
            <span className="flex size-4.5 items-center justify-center bg-gold text-[0.65rem] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>

        {/* 右側動作區：儲存搜尋 */}
        {children && <div className="ml-auto flex items-center gap-2">{children}</div>}
      </div>

      {/* 桌機「更多條件」：向下延展面板（推開內容，不彈窗） */}
      {openPanel === 'more' && (
        <div className="hidden border-t border-neutral-200 md:block dark:border-neutral-800">
          <div className="mx-auto max-h-[min(65vh,40rem)] w-full max-w-[1500px] overflow-y-auto px-4 py-6 sm:px-8">
            <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2">
              <div className="flex flex-col gap-6">
                <PersonaSection
                  state={state}
                  patch={patch}
                  personas={personas}
                  personaCopy={personaCopy}
                />
                <SqftSection locale={locale} state={state} patch={patch} labels={labels} />
              </div>
              <AdvancedSection
                state={state}
                patch={patch}
                labels={labels}
                orientations={orientations}
                amenityLabels={amenityLabels}
              />
            </div>
          </div>
          <div className="border-t border-neutral-100 dark:border-neutral-900">
            <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-8">
              <button
                type="button"
                onClick={reset}
                className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500 underline-offset-4 transition-colors hover:text-gold hover:underline"
              >
                {labels.reset}
              </button>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={close}
                  className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500 transition-colors hover:text-gold"
                >
                  {common.close}
                </button>
                <button type="button" onClick={applyAndClose} className={btn.primary}>
                  {labels.apply}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 手機全螢幕篩選彈窗 */}
      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center sm:p-6">
          <div className="flex max-h-[92dvh] w-full flex-col overflow-hidden border border-neutral-200 bg-white sm:max-w-xl sm:shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">
                {labels.title}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label={common.close}
                className="p-1.5 transition-colors hover:text-gold"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-6 overflow-y-auto px-5 py-5">
              <PersonaSection
                state={state}
                patch={patch}
                personas={personas}
                personaCopy={personaCopy}
              />
              <PriceSection locale={locale} state={state} patch={patch} labels={labels} />
              <RoomsSection state={state} patch={patch} labels={labels} />
              <TypeSection
                state={state}
                patch={patch}
                labels={labels}
                propertyTypes={propertyTypes}
              />
              <SqftSection locale={locale} state={state} patch={patch} labels={labels} />
              <AdvancedSection
                state={state}
                patch={patch}
                labels={labels}
                orientations={orientations}
                amenityLabels={amenityLabels}
              />
            </div>

            <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <button
                type="button"
                onClick={reset}
                className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500 underline-offset-4 transition-colors hover:text-gold hover:underline"
              >
                {labels.reset}
              </button>
              <button type="button" onClick={applyAndClose} className={btn.primary}>
                {labels.apply}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
