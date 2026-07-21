import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleEditor } from '@/components/agent/article-editor';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { requireRole } from '@/lib/auth';

export default async function NewPostPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireRole(locale, ['agent']);
  const dict = await getDictionary(locale);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-4 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/${locale}/agent/posts`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← {dict.common.back}
        </Link>
        <h2 className="text-xl font-bold">{dict.agentBlog.newTitle}</h2>
      </div>
      <ArticleEditor locale={locale} labels={dict.agentBlog} article={null} />
    </main>
  );
}
