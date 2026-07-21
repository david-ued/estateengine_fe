import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleCard } from '@/components/blog/article-card';
import { Reveal } from '@/components/reveal';
import { btn } from '@/components/ui/styles';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';
import type { Article, PagedResult } from '@/lib/types';

const PAGE_SIZE = 9;

async function fetchArticles(page: number): Promise<PagedResult<Article>> {
  try {
    return await apiFetch<PagedResult<Article>>(
      `/articles?page=${page}&pageSize=${PAGE_SIZE}`,
      { next: { revalidate: 60 } } as RequestInit,
    );
  } catch {
    return { items: [], total: 0, page, pageSize: PAGE_SIZE };
  }
}

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: dict.blog.pageTitle,
    description: dict.blog.subtitle,
  };
}

/** 專欄列表：深色刊頭 + 文章卡片格線（黑白金風格延續首頁） */
export default async function BlogIndexPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}>) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();

  const page = Math.max(1, Number(query.page) || 1);
  const [dict, result] = await Promise.all([
    getDictionary(locale),
    fetchArticles(page),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <main className="flex-1">
      {/* 刊頭：延續品牌深色帶 */}
      <section className="bg-ink py-20 text-center text-white sm:py-24">
        <div className="fade-up mx-auto max-w-2xl px-4 sm:px-8">
          <p className="eyebrow text-gold-soft">{dict.blog.eyebrow}</p>
          <h1 className="font-display mt-4 text-4xl sm:text-5xl">
            {dict.blog.pageTitle}
          </h1>
          <p className="mt-5 leading-relaxed text-white/70">
            {dict.blog.subtitle}
          </p>
        </div>
      </section>

      <section className="bg-cream py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          {result.items.length === 0 ? (
            <p className="text-center text-neutral-500">{dict.blog.empty}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((article, index) => (
                <ArticleCard
                  key={article.id}
                  locale={locale}
                  article={article}
                  index={index}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <Reveal className="mt-12 flex items-center justify-center gap-4">
              {page > 1 && (
                <Link href={`/${locale}/blog?page=${page - 1}`} className={btn.secondary}>
                  {dict.listings.prev}
                </Link>
              )}
              <span className="text-sm text-neutral-500">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link href={`/${locale}/blog?page=${page + 1}`} className={btn.secondary}>
                  {dict.listings.next}
                </Link>
              )}
            </Reveal>
          )}
        </div>
      </section>
    </main>
  );
}
