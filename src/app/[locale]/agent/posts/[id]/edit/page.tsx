import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleEditor } from '@/components/agent/article-editor';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Article } from '@/lib/types';

export default async function EditPostPage({
  params,
}: Readonly<{ params: Promise<{ locale: string; id: string }> }>) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const { user } = await requireRole(locale, ['agent']);
  const dict = await getDictionary(locale);

  // RLS + author_id 過濾：只能編輯自己的文章
  const supabase = await createClient();
  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .eq('author_id', user.id)
    .maybeSingle<Article>();

  if (!article) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-4 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/${locale}/agent/posts`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← {dict.common.back}
        </Link>
        <h2 className="text-xl font-bold">{dict.agentBlog.editTitle}</h2>
      </div>
      <ArticleEditor locale={locale} labels={dict.agentBlog} article={article} />
    </main>
  );
}
