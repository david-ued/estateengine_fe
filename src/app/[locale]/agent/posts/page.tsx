import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  badgeClass,
  btn,
  tableClass,
  tableWrapClass,
  tdClass,
  thClass,
  theadClass,
  trClass,
} from '@/components/ui/styles';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Article } from '@/lib/types';

/** 專欄管理：自己的全部文章（含草稿），RLS 可讀作者本人所有狀態 */
export default async function AgentPostsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { user } = await requireRole(locale, ['agent']);
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const { data: articles } = await supabase
    .from('articles')
    .select(
      'id, slug, title, excerpt, cover_image_url, is_featured, status, published_at, created_at, updated_at',
    )
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })
    .returns<Article[]>();

  const labels = dict.agentBlog;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">{labels.listTitle}</h2>
        <Link href={`/${locale}/agent/posts/new`} className={btn.primary}>
          + {labels.newPost}
        </Link>
      </div>

      {!articles || articles.length === 0 ? (
        <p className="text-neutral-500">{labels.empty}</p>
      ) : (
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th scope="col" className={thClass}>{labels.colTitle}</th>
                <th scope="col" className={thClass}>{labels.colStatus}</th>
                <th scope="col" className={thClass}>{labels.colPublishedAt}</th>
                <th scope="col" className={thClass}>
                  <span className="sr-only">{labels.edit}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id} className={trClass}>
                  <td className={tdClass}>
                    <div className="flex items-center gap-2 font-medium">
                      {article.title}
                      {article.is_featured && (
                        <span className={`${badgeClass} bg-gold/10 text-gold`}>
                          {labels.featuredBadge}
                        </span>
                      )}
                    </div>
                    <div className="text-neutral-500">/{article.slug}</div>
                  </td>
                  <td className={tdClass}>
                    {labels.statusLabels[article.status]}
                  </td>
                  <td className={tdClass}>
                    {article.published_at
                      ? new Date(article.published_at).toLocaleDateString(locale)
                      : '—'}
                  </td>
                  <td className={tdClass}>
                    <span className="flex items-center justify-end gap-2">
                      {article.status === 'published' && (
                        <Link
                          href={`/${locale}/blog/${article.slug}`}
                          className={btn.quiet}
                        >
                          {labels.view}
                        </Link>
                      )}
                      <Link
                        href={`/${locale}/agent/posts/${article.id}/edit`}
                        className={btn.quiet}
                      >
                        {labels.edit}
                      </Link>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
