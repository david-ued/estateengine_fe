import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { articleDate } from '@/components/blog/article-card';
import {
  ArticleActions,
  ReadingProgress,
} from '@/components/blog/article-reader';
import { btn } from '@/components/ui/styles';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { ApiError, apiFetch } from '@/lib/api';
import { readingTimeMinutes } from '@/lib/reading-time';
import type { Article } from '@/lib/types';

async function fetchArticle(slug: string): Promise<Article | null> {
  try {
    // 公開端點；generateMetadata 與頁面同 render 共用（fetch 去重）
    return await apiFetch<Article>(
      `/articles/${encodeURIComponent(slug)}`,
      { next: { revalidate: 60 } } as RequestInit,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string; slug: string }> }>): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) return {};

  const description = article.excerpt ?? undefined;
  return {
    title: article.title,
    description,
    openGraph: {
      title: article.title,
      description,
      type: 'article',
      images: article.cover_image_url ? [article.cover_image_url] : undefined,
    },
  };
}

/** 專欄內頁：置中窄欄長文（Substack 式閱讀版面） */
export default async function ArticlePage({
  params,
}: Readonly<{ params: Promise<{ locale: string; slug: string }> }>) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const [dict, article] = await Promise.all([
    getDictionary(locale),
    fetchArticle(slug),
  ]);
  if (!article) notFound();

  const authorName =
    article.author?.display_name ?? article.author?.full_name ?? null;

  const minutes = readingTimeMinutes(article.content_html);
  const readingLabel = dict.blog.readingTime.replace('{n}', String(minutes));
  const actionLabels = {
    clap: dict.blog.clap,
    shareOnX: dict.blog.shareOnX,
    shareOnFacebook: dict.blog.shareOnFacebook,
    shareOnLinkedin: dict.blog.shareOnLinkedin,
    copyLink: dict.blog.copyLink,
    copied: dict.blog.copied,
  };

  return (
    <main className="flex-1 bg-white">
      <ReadingProgress />

      {/* 桌機右側 Medium 式浮動互動列 */}
      <ArticleActions
        slug={article.slug}
        title={article.title}
        labels={actionLabels}
        variant="rail"
      />

      <article className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-8 sm:py-20">
        <header className="fade-up text-center">
          <Link
            href={`/${locale}/blog`}
            className="eyebrow transition-colors hover:text-gold-soft"
          >
            ← {dict.blog.backToList}
          </Link>
          <h1 className="font-display mt-6 text-3xl leading-tight sm:text-5xl">
            {article.title}
          </h1>
          <div className="mt-6 flex items-center justify-center gap-3 text-sm text-neutral-500">
            {article.author?.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 遠端圖
              <img
                src={article.author.avatar_url}
                alt={authorName ?? ''}
                className="size-8 rounded-full object-cover"
              />
            )}
            {authorName && <span>{authorName}</span>}
            {authorName && <span aria-hidden="true">·</span>}
            <time dateTime={article.published_at ?? undefined}>
              {articleDate(article, locale)}
            </time>
            <span aria-hidden="true">·</span>
            <span>{readingLabel}</span>
          </div>
          <div className="gold-rule mx-auto mt-8" />
        </header>

        {article.cover_image_url && (
          <div className="fade-in mt-10">
            {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 遠端圖 */}
            <img
              src={article.cover_image_url}
              alt=""
              className="w-full object-cover"
            />
          </div>
        )}

        {/* 內文：Tiptap 產出、後端白名單消毒後的 HTML */}
        <div
          className="article-prose mt-10"
          dangerouslySetInnerHTML={{ __html: article.content_html ?? '' }}
        />

        {/* 行動裝置：文末置中互動列（桌機改用右側浮動列） */}
        <div className="mt-12 border-t border-neutral-200 pt-8 dark:border-neutral-800">
          <ArticleActions
            slug={article.slug}
            title={article.title}
            labels={actionLabels}
            variant="inline"
          />
        </div>
      </article>

      {/* 文末聯絡 CTA（延續全站深色帶收尾） */}
      <section className="bg-ink py-20 text-center text-white sm:py-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-8">
          <h2 className="font-display text-2xl sm:text-3xl">
            {dict.home.contactCtaTitle}
          </h2>
          <div className="gold-rule mx-auto mt-5" />
          <div className="mt-8">
            <Link href={`/${locale}/contact`} className={btn.onDark}>
              {dict.home.contactCtaButton}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
