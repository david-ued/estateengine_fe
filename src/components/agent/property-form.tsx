'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { AiQuickFill } from '@/components/agent/ai-quick-fill';
import {
  btn,
  cardClass,
  errorTextClass,
  inputClass,
  selectClass,
} from '@/components/ui/styles';
import type { Dictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';
import {
  BASEMENT_STATUSES,
  CITIES,
  ORIENTATIONS,
  PROPERTY_TYPES,
} from '@/lib/constants';
import { SCORE_DIMENSIONS, type ScoreDimension } from '@/lib/scoring';
import { createClient } from '@/lib/supabase/client';
import type { Property } from '@/lib/types';

type Labels = Dictionary['agentForm'];

const sectionClass = `${cardClass} flex flex-col gap-4`;
const labelClass = 'flex flex-col gap-1 text-sm';

const SCORE_LABEL_KEYS: Record<ScoreDimension, keyof Labels> = {
  school: 'scoreSchool',
  transit: 'scoreTransit',
  material: 'scoreMaterial',
  feng_shui: 'scoreFengShui',
  environment: 'scoreEnvironment',
};

const SCORE_FIELD_KEYS: Record<ScoreDimension, string> = {
  school: 'scoreSchool',
  transit: 'scoreTransit',
  material: 'scoreMaterial',
  feng_shui: 'scoreFengShui',
  environment: 'scoreEnvironment',
};

interface CreatedProperty {
  id: string;
}

/** 建立（property 為空）與編輯（帶入 property 預設值）共用表單 */
export function PropertyForm({
  locale,
  labels,
  property,
  ai,
}: Readonly<{
  locale: string;
  labels: Labels;
  property?: Property;
  ai?: Dictionary['ai'];
}>) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const isEdit = Boolean(property);
  const [scores, setScores] = useState<Record<ScoreDimension, number>>({
    school: property?.score_school ?? 50,
    transit: property?.score_transit ?? 50,
    material: property?.score_material ?? 50,
    feng_shui: property?.score_feng_shui ?? 50,
    environment: property?.score_environment ?? 50,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const text = (name: string) => {
      const value = form.get(name);
      return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
    };
    const num = (name: string) => {
      const value = text(name);
      return value !== undefined ? Number(value) : undefined;
    };

    const payload: Record<string, unknown> = {
      title: text('title'),
      description: text('description'),
      price: num('price'),
      city: text('city'),
      district: text('district'),
      address: text('address'),
      areaSqft: num('areaSqft'),
      beds: num('beds') ?? 0,
      baths: num('baths') ?? 0,
      propertyType: text('propertyType'),
      hasParking: form.get('hasParking') === 'on',
      schoolDistrict: text('schoolDistrict'),
      transitNotes: text('transitNotes'),
      floodZone: form.get('floodZone') === 'on',
      terrainNotes: text('terrainNotes'),
      fengShuiOrientation: text('fengShuiOrientation'),
      fengShuiNotes: text('fengShuiNotes'),
      builderName: text('builderName'),
      builderReputation: num('builderReputation'),
      materialGrade: num('materialGrade'),
      basementStatus: text('basementStatus'),
      customAttributes: {
        ...(property?.custom_attributes ?? {}),
        superstore: form.get('superstore') === 'on',
      },
    };
    for (const dimension of SCORE_DIMENSIONS) {
      payload[SCORE_FIELD_KEYS[dimension]] = scores[dimension];
    }

    const externalVideoUrl = text('externalVideoUrl');

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');

      let propertyId = property?.id;
      if (isEdit && propertyId) {
        await apiFetch(`/properties/${propertyId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
          token: session.access_token,
        });
      } else {
        const created = await apiFetch<CreatedProperty>('/properties', {
          method: 'POST',
          body: JSON.stringify(payload),
          token: session.access_token,
        });
        propertyId = created.id;
      }

      if (externalVideoUrl && propertyId) {
        const type = externalVideoUrl.includes('matterport')
          ? 'tour_3d'
          : 'external_video';
        await apiFetch('/media/external', {
          method: 'POST',
          body: JSON.stringify({ propertyId, type, url: externalVideoUrl }),
          token: session.access_token,
        });
      }

      router.push(`/${locale}/agent`);
      router.refresh();
    } catch {
      setError(labels.submitError);
      setPending(false);
    }
  }

  /** AI 解析結果半自動填表：抓到的欄位填入，沒抓到的留白給房仲手動補 */
  function applyAiFields(fields: Record<string, unknown>) {
    const form = formRef.current;
    if (!form) return;

    const setValue = (name: string, value: unknown) => {
      if (value === null || value === undefined || value === '') return;
      const el = form.elements.namedItem(name);
      if (el instanceof HTMLInputElement) {
        if (el.type === 'checkbox') el.checked = Boolean(value);
        else el.value = String(value);
      } else if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        el.value = String(value);
      }
    };

    for (const name of [
      'title', 'description', 'price', 'city', 'district', 'address',
      'areaSqft', 'beds', 'baths', 'propertyType', 'schoolDistrict',
      'transitNotes', 'terrainNotes', 'fengShuiOrientation', 'fengShuiNotes',
      'builderName', 'builderReputation', 'materialGrade', 'basementStatus',
    ]) {
      setValue(name, fields[name]);
    }
    setValue('floodZone', fields.floodZone);
    setValue('hasParking', fields.hasParking);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      {/* ⚡ AI 快速建檔（僅新增模式） */}
      {!isEdit && ai && <AiQuickFill labels={ai} onFilled={applyAiFields} />}

      {/* 基本資料 */}
      <section className={sectionClass}>
        <h2 className="font-semibold">{labels.sectionBasics}</h2>
        <label className={labelClass}>
          {labels.listingTitle}
          <input
            name="title"
            required
            defaultValue={property?.title ?? ''}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          {labels.description}
          <textarea
            name="description"
            rows={3}
            defaultValue={property?.description ?? ''}
            className={inputClass}
          />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            {labels.price}
            <input
              name="price"
              type="number"
              min="0"
              required
              defaultValue={property?.price ?? ''}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            {labels.areaSqft}
            <input
              name="areaSqft"
              type="number"
              min="0"
              required
              defaultValue={property?.area_sqft ?? ''}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            {labels.city}
            <select
              name="city"
              required
              defaultValue={property?.city ?? ''}
              className={selectClass}
            >
              <option value="" disabled>
                {labels.selectPlaceholder}
              </option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            {labels.district}
            <input
              name="district"
              defaultValue={property?.district ?? ''}
              className={inputClass}
            />
          </label>
        </div>
        <label className={labelClass}>
          {labels.address}
          <input
            name="address"
            defaultValue={property?.address ?? ''}
            className={inputClass}
          />
        </label>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <label className={labelClass}>
            {labels.beds}
            <input
              name="beds"
              type="number"
              min="0"
              defaultValue={property?.beds ?? 0}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            {labels.baths}
            <input
              name="baths"
              type="number"
              min="0"
              defaultValue={property?.baths ?? 0}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            {labels.propertyType}
            <select
              name="propertyType"
              defaultValue={property?.property_type ?? ''}
              className={selectClass}
            >
              <option value="">{labels.selectPlaceholder}</option>
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {labels.propertyTypes[type]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            name="hasParking"
            type="checkbox"
            defaultChecked={property?.has_parking ?? false}
            className="size-5"
          />
          {labels.hasParking}
        </label>
      </section>

      {/* 獨家數據建檔：手動標籤（MLS 沒有的專業細節） */}
      <section className={sectionClass}>
        <h2 className="font-semibold">{labels.sectionExclusive}</h2>
        <p className="text-xs text-neutral-500">{labels.sectionExclusiveHint}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            {labels.schoolDistrict}
            <input
              name="schoolDistrict"
              defaultValue={property?.school_district ?? ''}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            {labels.transitNotes}
            <input
              name="transitNotes"
              defaultValue={property?.transit_notes ?? ''}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            {labels.terrainNotes}
            <input
              name="terrainNotes"
              defaultValue={property?.terrain_notes ?? ''}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            {labels.fengShuiOrientation}
            <select
              name="fengShuiOrientation"
              defaultValue={property?.feng_shui_orientation ?? ''}
              className={selectClass}
            >
              <option value="">{labels.selectPlaceholder}</option>
              {ORIENTATIONS.map((orientation) => (
                <option key={orientation} value={orientation}>
                  {labels.orientations[orientation]}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            {labels.fengShuiNotes}
            <input
              name="fengShuiNotes"
              defaultValue={property?.feng_shui_notes ?? ''}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            {labels.builderName}
            <input
              name="builderName"
              defaultValue={property?.builder_name ?? ''}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            {labels.builderReputation}
            <select
              name="builderReputation"
              defaultValue={property?.builder_reputation ?? ''}
              className={selectClass}
            >
              <option value="">{labels.selectPlaceholder}</option>
              {[1, 2, 3, 4, 5].map((grade) => (
                <option key={grade} value={grade}>
                  {grade} ★
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            {labels.materialGrade}
            <select
              name="materialGrade"
              defaultValue={property?.material_grade ?? ''}
              className={selectClass}
            >
              <option value="">{labels.selectPlaceholder}</option>
              {[1, 2, 3, 4, 5].map((grade) => (
                <option key={grade} value={grade}>
                  {grade} ★
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            {labels.basementStatus}
            <select
              name="basementStatus"
              defaultValue={property?.basement_status ?? 'none'}
              className={selectClass}
            >
              {BASEMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {labels.basementOptions[status]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            name="floodZone"
            type="checkbox"
            defaultChecked={property?.flood_zone ?? false}
            className="size-5"
          />
          {labels.floodZone}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            name="superstore"
            type="checkbox"
            defaultChecked={Boolean(property?.custom_attributes?.superstore)}
            className="size-5"
          />
          {labels.superstore}
        </label>
      </section>

      {/* 維度評分：權重配對的資料來源 */}
      <section className={sectionClass}>
        <h2 className="font-semibold">{labels.sectionScores}</h2>
        {SCORE_DIMENSIONS.map((dimension) => (
          <label key={dimension} className={labelClass}>
            <span className="flex justify-between">
              {labels[SCORE_LABEL_KEYS[dimension]] as string}
              <span className="font-mono">{scores[dimension]}</span>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={scores[dimension]}
              onChange={(e) =>
                setScores((prev) => ({
                  ...prev,
                  [dimension]: Number(e.target.value),
                }))
              }
              className="accent-brand"
            />
          </label>
        ))}
      </section>

      {/* 外部媒體：YouTube / Vimeo / Matterport 嵌入（編輯模式在照片管理區塊處理） */}
      {!isEdit && (
        <section className={sectionClass}>
          <h2 className="font-semibold">{labels.sectionMedia}</h2>
          <label className={labelClass}>
            {labels.externalVideoUrl}
            <input
              name="externalVideoUrl"
              type="url"
              placeholder="https://youtube.com/watch?v=…"
              className={inputClass}
            />
          </label>
          <p className="text-xs text-neutral-500">{labels.externalVideoHint}</p>
        </section>
      )}

      {error && <p className={errorTextClass}>{error}</p>}
      <button type="submit" disabled={pending} className={btn.primary}>
        {pending ? labels.submitting : isEdit ? labels.saveChanges : labels.submit}
      </button>
    </form>
  );
}
