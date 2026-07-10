import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FilterBar, type ListingFilters } from '@/components/listings/filter-bar';
import { ListingsExplorer } from '@/components/listings/listings-explorer';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';
import type { PagedResult, Property } from '@/lib/types';

// PRD：為避免資訊過載，列表頁一次最多僅顯示 6-7 個物件
const PAGE_SIZE = 6;

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
  'superstore',
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
    // 後端未啟動 / DB 未連線時優雅降級為空列表
    return null;
  }
}

function pageHref(locale: string, filters: ListingFilters, page: number): string {
  const params = new URLSearchParams(filters as Record<string, string>);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return `/${locale}/properties${query ? `?${query}` : ''}`;
}

export default async function PropertiesPage({
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
    <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">{dict.nav.listings}</h1>
        <span className="text-sm text-neutral-500">
          {total} {dict.listings.results}
        </span>
      </div>

      <div className="mb-6">
        <FilterBar
          locale={locale}
          labels={dict.filters}
          orientations={dict.agentForm.orientations}
          propertyTypes={dict.agentForm.propertyTypes}
          defaults={filters}
        />
      </div>

      {items.length === 0 ? (
        <p className="py-16 text-center text-neutral-500">{dict.listings.noResults}</p>
      ) : (
        <ListingsExplorer
          locale={locale}
          properties={items}
          sort={filters.sort}
          dict={{
            filters: dict.filters,
            weights: dict.weights,
            personas: dict.personas,
            listings: dict.listings,
          }}
        />
      )}

      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-4 text-sm">
          {page > 1 && (
            <Link href={pageHref(locale, filters, page - 1)} className="hover:underline">
              ← {dict.listings.prev}
            </Link>
          )}
          <span className="text-neutral-500">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={pageHref(locale, filters, page + 1)} className="hover:underline">
              {dict.listings.next} →
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
