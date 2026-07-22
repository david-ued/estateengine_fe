import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FilterBar, type ListingFilters } from '@/components/listings/filter-bar';
import { ListingsExplorer } from '@/components/listings/listings-explorer';
import { SaveSearchButton } from '@/components/listings/save-search-button';
import { btn } from '@/components/ui/styles';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';
import type { PagedResult, Property } from '@/lib/types';

// PRD：為避免資訊過載，列表頁一次最多僅顯示 6-7 個物件
const PAGE_SIZE = 6;

// URL query 沿用原 /properties 的參數命名（BE API 不變）
const FILTER_KEYS = [
  'city',
  'minPrice',
  'maxPrice',
  'minSqft',
  'maxSqft',
  'beds',
  'baths',
  'propertyType',
  'minSchool',
  'minBuilder',
  'minMaterial',
  'orientation',
  'amenities',
  'petsAllowed',
  'sort',
] as const;

type SearchParams = Record<string, string | string[] | undefined>;

function pickFilters(searchParams: SearchParams): ListingFilters {
  const filters: Record<string, string> = {};
  for (const key of FILTER_KEYS) {
    const value = searchParams[key];
    if (typeof value === 'string' && value !== '') filters[key] = value;
  }
  return filters;
}

async function fetchListings(
  filters: ListingFilters,
  page: number,
): Promise<PagedResult<Property> | null> {
  const params = new URLSearchParams(filters as Record<string, string>);
  params.set('page', String(page));
  params.set('pageSize', String(PAGE_SIZE));

  try {
    return await apiFetch<PagedResult<Property>>(`/properties?${params}`, {
      cache: 'no-store',
    });
  } catch {
    // 後端未啟動 / DB 未連線 → null 代表載入失敗（與「查無結果」區分）
    return null;
  }
}

function pageHref(locale: string, filters: ListingFilters, page: number): string {
  const params = new URLSearchParams(filters as Record<string, string>);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return `/${locale}/search${query ? `?${query}` : ''}`;
}

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.search.pageTitle };
}

export default async function SearchPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const sp = await searchParams;
  const filters = pickFilters(sp);
  const page = Math.max(1, Number(sp.page) || 1);

  const [dict, result] = await Promise.all([
    getDictionary(locale),
    fetchListings(filters, page),
  ]);

  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="flex flex-1 flex-col">
      <h1 className="sr-only">{dict.search.pageTitle}</h1>

      {/* 頂部橫向篩選列（sticky 在 nav 下方），右側掛「儲存搜尋」 */}
      <FilterBar
        locale={locale}
        labels={dict.filters}
        search={{
          anyPrice: dict.search.anyPrice,
          moreFilters: dict.search.moreFilters,
        }}
        common={{ close: dict.common.close }}
        orientations={dict.agentForm.orientations}
        propertyTypes={dict.agentForm.propertyTypes}
        amenityLabels={dict.agentForm.amenityOptions}
        personas={dict.personas}
        personaCopy={dict.weights}
        defaults={filters}
      >
        <SaveSearchButton
          locale={locale}
          labels={{
            saveSearch: dict.search.saveSearch,
            saveSearchTitle: dict.search.saveSearchTitle,
            saveSearchNamePlaceholder: dict.search.saveSearchNamePlaceholder,
            saveSearchSuccess: dict.search.saveSearchSuccess,
            saveSearchError: dict.search.saveSearchError,
            saveSearchLogin: dict.search.saveSearchLogin,
          }}
          common={{ save: dict.common.save, cancel: dict.common.cancel }}
        />
      </FilterBar>

      <div className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-8">
        {result === null ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-neutral-500">{dict.listings.loadError}</p>
            <Link href={pageHref(locale, filters, page)} className={btn.secondary}>
              {dict.common.retry}
            </Link>
          </div>
        ) : (
          <ListingsExplorer
            locale={locale}
            properties={items}
            total={total}
            pagination={{
              page,
              totalPages,
              prevHref: page > 1 ? pageHref(locale, filters, page - 1) : null,
              nextHref: page < totalPages ? pageHref(locale, filters, page + 1) : null,
            }}
            dict={{
              filters: dict.filters,
              listings: dict.listings,
              favorite: dict.favorite,
              search: { results: dict.search.results },
            }}
          />
        )}
      </div>
    </main>
  );
}
