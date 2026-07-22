import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AccountTabs } from '@/components/account/account-tabs';
import {
  InterestList,
  type InterestRowData,
} from '@/components/account/interest-list';
import { ProspectReadinessForm } from '@/components/account/prospect-readiness-form';
import { btn } from '@/components/ui/styles';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';
import { getUserProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type {
  FavoriteEntry,
  ProspectFinance,
  PropertyInterest,
} from '@/lib/types';

interface ReadinessData {
  finance: ProspectFinance;
  rows: InterestRowData[];
}

/** 表態列表 = 已表態的物件 + 收藏但尚未表態的物件（後者以「考慮中」呈現） */
async function fetchReadiness(token: string): Promise<ReadinessData | null> {
  try {
    const [finance, interests, favorites] = await Promise.all([
      apiFetch<ProspectFinance>('/prospects/me', { token, cache: 'no-store' }),
      apiFetch<PropertyInterest[]>('/prospects/me/interests', {
        token,
        cache: 'no-store',
      }),
      apiFetch<FavoriteEntry[]>('/favorites', { token, cache: 'no-store' }),
    ]);

    const decided = new Set(interests.map((i) => i.property.id));
    const rows: InterestRowData[] = [
      ...interests.map((i) => ({
        property: i.property,
        decision: i.decision,
        act_fast: i.act_fast,
        decided_at: i.decided_at,
      })),
      ...favorites
        .filter((f) => !decided.has(f.property.id))
        .map((f) => ({
          property: f.property,
          decision: 'considering' as const,
          act_fast: false,
          decided_at: null,
        })),
    ];
    return { finance, rows };
  } catch {
    return null;
  }
}

/** 帳號中心「購屋準備」：財務準備度自助申報 + 物件表態（lock-in / walk away） */
export default async function ReadinessPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getUserProfile();
  if (!session) redirect(`/${locale}/login`);

  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const {
    data: { session: authSession },
  } = await supabase.auth.getSession();
  if (!authSession) redirect(`/${locale}/login`);

  const data = await fetchReadiness(authSession.access_token);
  const r = dict.account.readiness;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-8 sm:py-14">
      <header>
        <h1 className="font-display text-3xl sm:text-4xl">
          {dict.account.title}
        </h1>
        <div className="gold-rule mt-5" />
      </header>

      <AccountTabs
        locale={locale}
        labels={{
          saved: dict.account.navSaved,
          readiness: dict.account.navReadiness,
          settings: dict.account.navSettings,
        }}
      />

      {data === null ? (
        <div className="mt-12 flex flex-col items-center gap-4 border border-neutral-200 py-16 text-center dark:border-neutral-800">
          <p className="text-neutral-500">{dict.common.errorBody}</p>
          <Link href={`/${locale}/account/readiness`} className={btn.secondary}>
            {dict.common.retry}
          </Link>
        </div>
      ) : (
        <>
          {/* 財務準備（房貸預批 / 資產證明） */}
          <section className="mt-12">
            <h2 className="eyebrow">{r.financeTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm text-neutral-500">
              {r.financeIntro}
            </p>
            <ProspectReadinessForm initial={data.finance} labels={r} />
          </section>

          {/* 物件表態（lock-in / walk away） */}
          <section className="mt-16">
            <h2 className="eyebrow">{r.interestsTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm text-neutral-500">
              {r.interestsIntro}
            </p>
            {data.rows.length === 0 ? (
              <div className="mt-6 flex flex-col items-center gap-5 border border-neutral-200 px-6 py-16 text-center dark:border-neutral-800">
                <p className="max-w-md text-neutral-500">{r.interestsEmpty}</p>
                <Link href={`/${locale}/search`} className={btn.primary}>
                  {dict.account.browseCta}
                </Link>
              </div>
            ) : (
              <InterestList
                locale={locale}
                rows={data.rows}
                labels={{
                  decision: r.decision,
                  lockIn: r.lockIn,
                  walkAway: r.walkAway,
                  reset: r.reset,
                  actFastBadge: r.actFastBadge,
                  unavailable: dict.account.unavailable,
                  error: r.error,
                }}
              />
            )}
          </section>
        </>
      )}
    </main>
  );
}
