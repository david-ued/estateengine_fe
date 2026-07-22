import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AccountTabs } from '@/components/account/account-tabs';
import { SavedSearchList } from '@/components/account/saved-search-list';
import { ListingCard } from '@/components/listings/listing-card';
import { badgeClass, btn } from '@/components/ui/styles';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';
import { getUserProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { FavoriteEntry, SavedSearch } from '@/lib/types';

interface AccountData {
  favorites: FavoriteEntry[];
  savedSearches: SavedSearch[];
}

/** BE 未啟動 / 讀取失敗回傳 null（與「空清單」區分） */
async function fetchAccountData(token: string): Promise<AccountData | null> {
  try {
    const [favorites, savedSearches] = await Promise.all([
      apiFetch<FavoriteEntry[]>('/favorites', { token, cache: 'no-store' }),
      apiFetch<SavedSearch[]>('/saved-searches', { token, cache: 'no-store' }),
    ]);
    return { favorites, savedSearches };
  } catch {
    return null;
  }
}

/** 我的帳號：上半「我的收藏」、下半「儲存的搜尋」（買家 / agent 皆可用） */
export default async function AccountPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // 需登入：未登入導向登入頁
  const session = await getUserProfile();
  if (!session) redirect(`/${locale}/login`);

  const dict = await getDictionary(locale);

  // NestJS API 需要 Supabase access token（同 client 端 apiFetch 用法）
  const supabase = await createClient();
  const {
    data: { session: authSession },
  } = await supabase.auth.getSession();
  if (!authSession) redirect(`/${locale}/login`);

  const data = await fetchAccountData(authSession.access_token);

  const cardDict = {
    filters: dict.filters,
    listings: dict.listings,
    favorite: dict.favorite,
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-8 sm:py-14">
      <header>
        <h1 className="font-display text-3xl sm:text-4xl">{dict.account.title}</h1>
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
          <Link href={`/${locale}/account`} className={btn.secondary}>
            {dict.common.retry}
          </Link>
        </div>
      ) : (
        <>
          {/* 我的收藏 */}
          <section className="mt-12">
            <h2 className="eyebrow">{dict.account.favoritesTitle}</h2>
            {data.favorites.length === 0 ? (
              <div className="mt-6 flex flex-col items-center gap-5 border border-neutral-200 px-6 py-16 text-center dark:border-neutral-800">
                <p className="max-w-md text-neutral-500">
                  {dict.account.favoritesEmpty}
                </p>
                <Link href={`/${locale}/search`} className={btn.primary}>
                  {dict.account.browseCta}
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
                {data.favorites.map(({ property }, index) => (
                  <div key={property.id}>
                    {property.status !== 'published' && (
                      <p
                        className={`${badgeClass} mb-2 border border-neutral-300 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400`}
                      >
                        {dict.account.unavailable}
                      </p>
                    )}
                    <ListingCard
                      locale={locale}
                      property={property}
                      dict={cardDict}
                      index={index}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 儲存的搜尋 */}
          <section className="mt-16">
            <h2 className="eyebrow">{dict.account.savedSearchesTitle}</h2>
            <SavedSearchList
              locale={locale}
              items={data.savedSearches}
              labels={dict.account}
              deleteLabel={dict.common.delete}
              filters={dict.filters}
            />
          </section>
        </>
      )}
    </main>
  );
}
