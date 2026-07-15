import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReadToggle } from '@/components/agent/read-toggle';
import { badgeClass, btn, cardClass } from '@/components/ui/styles';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { ContactMessage } from '@/lib/types';

const PAGE_SIZE = 10;

interface InboxResult {
  items: ContactMessage[];
  total: number;
  unread: number;
  page: number;
  pageSize: number;
}

async function fetchInbox(token: string, page: number): Promise<InboxResult | null> {
  try {
    return await apiFetch<InboxResult>(
      `/contact?page=${page}&pageSize=${PAGE_SIZE}`,
      { token, cache: 'no-store' },
    );
  } catch {
    // BE 未啟動 / 讀取失敗 → null（顯示錯誤而非空收件匣）
    return null;
  }
}

function pageHref(locale: string, page: number): string {
  return `/${locale}/agent/inbox${page > 1 ? `?page=${page}` : ''}`;
}

/** agent 聯絡訊息收件匣：未讀數 + 訊息列表 + 已讀/未讀切換 */
export default async function AgentInboxPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireRole(locale, ['agent']);
  const dict = await getDictionary(locale);

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const result = session
    ? await fetchInbox(session.access_token, page)
    : null;

  const totalPages = result
    ? Math.max(1, Math.ceil(result.total / result.pageSize))
    : 1;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-8">
      <div className="mb-6 flex items-center gap-4">
        <h2 className="text-xl font-bold">{dict.inbox.title}</h2>
        {result && result.unread > 0 && (
          <span className={`${badgeClass} border border-gold text-gold`}>
            {dict.inbox.unread} · {result.unread}
          </span>
        )}
      </div>

      {result === null ? (
        <div className="flex flex-col items-center gap-4 border border-neutral-200 py-16 text-center dark:border-neutral-800">
          <p className="text-neutral-500">{dict.common.errorBody}</p>
          <Link href={pageHref(locale, page)} className={btn.secondary}>
            {dict.common.retry}
          </Link>
        </div>
      ) : result.items.length === 0 ? (
        <p className="border border-neutral-200 px-6 py-16 text-center text-neutral-500 dark:border-neutral-800">
          {dict.inbox.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {result.items.map((message) => (
            <li
              key={message.id}
              className={`${cardClass} ${message.is_read ? '' : 'border-l-2 border-l-gold'}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p
                    className={`flex items-center gap-2 ${
                      message.is_read ? 'font-medium' : 'font-bold'
                    }`}
                  >
                    {!message.is_read && (
                      <span
                        aria-hidden="true"
                        className="inline-block size-2 rounded-full bg-gold"
                      />
                    )}
                    {message.name}
                  </p>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    <a
                      href={`mailto:${message.email}`}
                      className="transition-colors hover:text-gold"
                    >
                      {message.email}
                    </a>
                    {message.phone ? ` · ${message.phone}` : ''}
                  </p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-xs uppercase tracking-[0.08em] text-neutral-400">
                    {dict.inbox.receivedAt}{' '}
                    {new Date(message.created_at).toLocaleString(locale)}
                  </p>
                  <div className="mt-2">
                    <ReadToggle
                      messageId={message.id}
                      isRead={message.is_read}
                      labels={{
                        markRead: dict.inbox.markRead,
                        markUnread: dict.inbox.markUnread,
                      }}
                      errorText={dict.agent.actionError}
                    />
                  </div>
                </div>
              </div>

              <p
                className={`mt-3 whitespace-pre-line border-t border-neutral-100 pt-3 text-sm leading-relaxed dark:border-neutral-800 ${
                  message.is_read
                    ? 'text-neutral-600 dark:text-neutral-300'
                    : 'font-semibold'
                }`}
              >
                {message.message}
              </p>

              {message.property && (
                <p className="mt-3 text-xs uppercase tracking-[0.08em] text-neutral-400">
                  {dict.inbox.regarding}:{' '}
                  <Link
                    href={`/${locale}/properties/${message.property.id}`}
                    className="text-gold underline-offset-2 hover:underline"
                  >
                    {message.property.title}
                  </Link>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {result !== null && totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-4 text-sm">
          {page > 1 && (
            <Link href={pageHref(locale, page - 1)} className="hover:underline">
              ← {dict.listings.prev}
            </Link>
          )}
          <span className="text-neutral-500">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={pageHref(locale, page + 1)} className="hover:underline">
              {dict.listings.next} →
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
