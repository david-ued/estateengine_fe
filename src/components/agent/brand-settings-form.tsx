'use client';

import { useState } from 'react';
import {
  btn,
  cardClass,
  errorTextClass,
  inputClass,
  successTextClass,
} from '@/components/ui/styles';
import type { Dictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import type {
  AgentCard,
  SiteLocaleCopy,
  SiteSettingsData,
} from '@/lib/types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const VALUE_COUNT = 4;
const SITE_LOCALES = ['zh-TW', 'en'] as const;
type SiteLocale = (typeof SITE_LOCALES)[number];

// 語系分組標題以該語言自稱（非介面文案，不隨介面語系切換）
const LOCALE_HEADINGS: Record<SiteLocale, string> = {
  'zh-TW': '繁體中文',
  en: 'English',
};

interface ValueRow {
  title: string;
  body: string;
}

interface LocaleDraft {
  heroTitle: string;
  heroSubtitle: string;
  story: string;
  values: ValueRow[]; // 固定四項
}

function toDraft(copy: SiteLocaleCopy | undefined): LocaleDraft {
  return {
    heroTitle: copy?.heroTitle ?? '',
    heroSubtitle: copy?.heroSubtitle ?? '',
    story: copy?.story ?? '',
    values: Array.from({ length: VALUE_COUNT }, (_, index) => ({
      title: copy?.values?.[index]?.title ?? '',
      body: copy?.values?.[index]?.body ?? '',
    })),
  };
}

function toCopy(draft: LocaleDraft): SiteLocaleCopy {
  const values = draft.values
    .map((value) => ({ title: value.title.trim(), body: value.body.trim() }))
    .filter((value) => value.title !== '' || value.body !== '');

  const copy: SiteLocaleCopy = {};
  if (draft.heroTitle.trim()) copy.heroTitle = draft.heroTitle.trim();
  if (draft.heroSubtitle.trim()) copy.heroSubtitle = draft.heroSubtitle.trim();
  if (draft.story.trim()) copy.story = draft.story.trim();
  if (values.length > 0) copy.values = values;
  return copy;
}

async function getAccessToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('no session');
  return session.access_token;
}

function Field({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      {children}
    </label>
  );
}

function SaveRow({
  state,
  labels,
}: Readonly<{ state: SaveState; labels: Dictionary['brand'] }>) {
  return (
    <div className="flex items-center gap-4">
      <button type="submit" disabled={state === 'saving'} className={btn.primary}>
        {state === 'saving' ? labels.saving : labels.save}
      </button>
      {state === 'saved' && <p className={successTextClass}>{labels.saved}</p>}
      {state === 'error' && <p className={errorTextClass}>{labels.error}</p>}
    </div>
  );
}

/** 品牌設定兩張卡：個人名片（/site/profile）與首頁內容（/site/settings） */
export function BrandSettingsForm({
  labels,
  agent,
  settings,
}: Readonly<{
  labels: Dictionary['brand'];
  agent: AgentCard | null;
  settings: SiteSettingsData;
}>) {
  // ---- 卡 1：個人名片 ----
  // 單一 agent 品牌站不對外顯示仲介公司，表單不提供 agencyName 編輯
  const [profile, setProfile] = useState({
    displayName: agent?.display_name ?? '',
    fullName: agent?.full_name ?? '',
    licenseNo: agent?.license_no ?? '',
    phone: agent?.phone ?? '',
    lineId: agent?.contact_line_id ?? '',
    avatarUrl: agent?.avatar_url ?? '',
    bio: agent?.bio ?? '',
  });
  const [profileState, setProfileState] = useState<SaveState>('idle');

  function setProfileField(key: keyof typeof profile, value: string) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileState('saving');
    try {
      const token = await getAccessToken();
      const body: Record<string, unknown> = {
        displayName: profile.displayName.trim(),
        fullName: profile.fullName.trim(),
        licenseNo: profile.licenseNo.trim(),
        bio: profile.bio.trim(),
        phone: profile.phone.trim(),
        contactLineId: profile.lineId.trim(),
        avatarUrl: profile.avatarUrl.trim(),
      };
      // 本表單不編輯社群連結，原值透傳避免被清除
      if (agent?.social_links) body.socialLinks = agent.social_links;

      await apiFetch('/site/profile', {
        method: 'PATCH',
        body: JSON.stringify(body),
        token,
      });
      setProfileState('saved');
    } catch {
      setProfileState('error');
    }
  }

  // ---- 卡 2：首頁內容 ----
  const [stats, setStats] = useState({
    sold: settings.stats?.sold != null ? String(settings.stats.sold) : '',
    volume: settings.stats?.volume ?? '',
    years: settings.stats?.years != null ? String(settings.stats.years) : '',
  });
  const [drafts, setDrafts] = useState<Record<SiteLocale, LocaleDraft>>({
    'zh-TW': toDraft(settings.locales?.['zh-TW']),
    en: toDraft(settings.locales?.en),
  });
  const [siteState, setSiteState] = useState<SaveState>('idle');

  function setDraftField(
    siteLocale: SiteLocale,
    key: 'heroTitle' | 'heroSubtitle' | 'story',
    value: string,
  ) {
    setDrafts((prev) => ({
      ...prev,
      [siteLocale]: { ...prev[siteLocale], [key]: value },
    }));
  }

  function setValueField(
    siteLocale: SiteLocale,
    index: number,
    key: keyof ValueRow,
    value: string,
  ) {
    setDrafts((prev) => ({
      ...prev,
      [siteLocale]: {
        ...prev[siteLocale],
        values: prev[siteLocale].values.map((row, i) =>
          i === index ? { ...row, [key]: value } : row,
        ),
      },
    }));
  }

  async function handleSiteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSiteState('saving');
    try {
      const token = await getAccessToken();

      const nextStats: NonNullable<SiteSettingsData['stats']> = {};
      if (stats.sold.trim() !== '') nextStats.sold = Number(stats.sold);
      if (stats.volume.trim() !== '') nextStats.volume = stats.volume.trim();
      if (stats.years.trim() !== '') nextStats.years = Number(stats.years);

      const data: SiteSettingsData = {
        stats: nextStats,
        locales: {
          'zh-TW': toCopy(drafts['zh-TW']),
          en: toCopy(drafts.en),
        },
      };

      await apiFetch('/site/settings', {
        method: 'PUT',
        body: JSON.stringify({ data }),
        token,
      });
      setSiteState('saved');
    } catch {
      setSiteState('error');
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 卡 1：個人名片 */}
      <form onSubmit={handleProfileSubmit} className={`${cardClass} flex flex-col gap-5`}>
        <h3 className="eyebrow">{labels.profileSection}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={labels.displayName}>
            <input
              value={profile.displayName}
              onChange={(e) => setProfileField('displayName', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={labels.fullName}>
            <input
              value={profile.fullName}
              onChange={(e) => setProfileField('fullName', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={labels.licenseNo}>
            <input
              value={profile.licenseNo}
              onChange={(e) => setProfileField('licenseNo', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={labels.phone}>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfileField('phone', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={labels.lineId}>
            <input
              value={profile.lineId}
              onChange={(e) => setProfileField('lineId', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label={labels.avatarUrl}>
          <input
            type="url"
            value={profile.avatarUrl}
            onChange={(e) => setProfileField('avatarUrl', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={labels.bio}>
          <textarea
            rows={5}
            value={profile.bio}
            onChange={(e) => setProfileField('bio', e.target.value)}
            className={inputClass}
          />
        </Field>
        <SaveRow state={profileState} labels={labels} />
      </form>

      {/* 卡 2：首頁內容 */}
      <form onSubmit={handleSiteSubmit} className={`${cardClass} flex flex-col gap-6`}>
        <h3 className="eyebrow">{labels.siteSection}</h3>

        {/* 實績數字 */}
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold">
            {labels.statsSection}
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label={labels.statSold}>
              <input
                type="number"
                min={0}
                value={stats.sold}
                onChange={(e) =>
                  setStats((prev) => ({ ...prev, sold: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label={labels.statVolume}>
              <input
                value={stats.volume}
                onChange={(e) =>
                  setStats((prev) => ({ ...prev, volume: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label={labels.statYears}>
              <input
                type="number"
                min={0}
                value={stats.years}
                onChange={(e) =>
                  setStats((prev) => ({ ...prev, years: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
          </div>
        </fieldset>

        {/* zh-TW / en 兩組文案並排（桌機） */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {SITE_LOCALES.map((siteLocale) => {
            const draft = drafts[siteLocale];
            return (
              <fieldset
                key={siteLocale}
                className="flex flex-col gap-4 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              >
                <legend className="pr-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  {LOCALE_HEADINGS[siteLocale]}
                </legend>
                <Field label={labels.heroTitle}>
                  <input
                    value={draft.heroTitle}
                    onChange={(e) =>
                      setDraftField(siteLocale, 'heroTitle', e.target.value)
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label={labels.heroSubtitle}>
                  <input
                    value={draft.heroSubtitle}
                    onChange={(e) =>
                      setDraftField(siteLocale, 'heroSubtitle', e.target.value)
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label={labels.story}>
                  <textarea
                    rows={5}
                    value={draft.story}
                    onChange={(e) =>
                      setDraftField(siteLocale, 'story', e.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <p className="mt-1 text-sm font-semibold">{labels.valuesSection}</p>
                {draft.values.map((row, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-2 border border-neutral-200 p-3 dark:border-neutral-800"
                  >
                    <Field label={`${labels.valueTitle} ${index + 1}`}>
                      <input
                        value={row.title}
                        onChange={(e) =>
                          setValueField(siteLocale, index, 'title', e.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label={labels.valueBody}>
                      <textarea
                        rows={2}
                        value={row.body}
                        onChange={(e) =>
                          setValueField(siteLocale, index, 'body', e.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                ))}
              </fieldset>
            );
          })}
        </div>

        <SaveRow state={siteState} labels={labels} />
      </form>
    </div>
  );
}
