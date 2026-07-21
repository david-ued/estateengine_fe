import Link from 'next/link';
import { Reveal } from '@/components/reveal';
import type { Locale } from '@/i18n/config';
import type { Article } from '@/lib/types';

/** 文章發佈日（無發佈時間退回建立時間，僅後台預覽會遇到） */
export function articleDate(article: Article, locale: Locale): string {
  return new Date(article.published_at ?? article.created_at).toLocaleDateString(
    locale,
    { year: 'numeric', month: 'long', day: 'numeric' },
  );
}

/** 專欄文章卡：首頁精選與 /blog 列表共用（黑白金、方角、細框） */
export function ArticleCard({
  locale,
  article,
  index = 0,
}: Readonly<{ locale: Locale; article: Article; index?: number }>) {
  return (
    <Reveal delay={index * 100}>
      <Link
        href={`/${locale}/blog/${article.slug}`}
        className="card-lift group flex h-full flex-col border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
      >
        {article.cover_image_url ? (
          <div className="aspect-[16/9] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 遠端圖 */}
            <img
              src={article.cover_image_url}
              alt=""
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        ) : (
          // 無封面：深色底 + 金色大字首，維持卡片高度節奏
          <div className="flex aspect-[16/9] items-center justify-center bg-ink">
            <span className="font-display text-4xl text-gold-soft">
              {article.title.slice(0, 1)}
            </span>
          </div>
        )}
        <div className="flex flex-1 flex-col p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
            {articleDate(article, locale)}
          </p>
          <h3 className="font-display mt-3 text-xl leading-snug transition-colors group-hover:text-gold">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {article.excerpt}
            </p>
          )}
        </div>
      </Link>
    </Reveal>
  );
}
