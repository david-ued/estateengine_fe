'use client';

import { IconMessageCircle, IconX } from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  btn,
  errorTextClass,
  inputClass,
} from '@/components/ui/styles';
import type { Dictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';

type Status = 'idle' | 'pending' | 'success' | 'error';

/**
 * 右下角浮動「聯絡房仲」小窗（親切版）：所有公開頁常駐，
 * 免登入即可留言 → POST /contact 進 agent 收件匣。
 * 在 /contact 頁隱藏（該頁已有完整表單）；
 * 於物件內頁開啟時自動帶上 propertyId，讓房仲知道是在問哪個物件。
 */
export function ContactWidget({
  locale,
  agentName,
  avatarUrl,
  labels,
  form,
}: Readonly<{
  locale: string;
  agentName: string;
  avatarUrl: string | null;
  labels: Dictionary['contactWidget'];
  form: Dictionary['contact'];
}>) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  // /contact 頁已有完整表單，不重複出現
  if (pathname?.startsWith(`/${locale}/contact`)) return null;

  // 物件內頁 → 留言自動關聯該物件
  const propertyId = /^\/[^/]+\/properties\/([0-9a-f-]{36})$/i.exec(
    pathname ?? '',
  )?.[1];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('pending');
    try {
      await apiFetch<unknown>('/contact', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          message,
          propertyId,
          locale,
        }),
      });
      setMessage('');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <section
          aria-label={labels.open}
          className="flex w-[min(92vw,22rem)] flex-col overflow-hidden border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950"
        >
          {/* 深色親切開場：頭像 + 打招呼 */}
          <div className="bg-ink px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              {avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 遠端圖
                <img
                  src={avatarUrl}
                  alt=""
                  className="size-10 shrink-0 rounded-full object-cover"
                />
              )}
              <p className="font-display text-lg">
                {labels.greeting.replace('{name}', agentName)}
              </p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              {labels.intro}
            </p>
          </div>

          {status === 'success' ? (
            <div className="flex flex-col gap-3 px-5 py-6">
              <p className="font-medium">{labels.success}</p>
              <p className="text-sm text-neutral-500">{labels.successBody}</p>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className={`${btn.quiet} self-start`}
              >
                {labels.sendAnother}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-5">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {form.name}
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {form.email}
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-xs text-neutral-600 dark:text-neutral-400">
                {form.message}
                <textarea
                  required
                  rows={4}
                  placeholder={form.messagePlaceholder}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={inputClass}
                />
              </label>
              {status === 'error' && (
                <p className={errorTextClass} role="alert">
                  {form.error}
                </p>
              )}
              <button
                type="submit"
                disabled={status === 'pending'}
                className={`${btn.primary} w-full`}
              >
                {status === 'pending' ? form.sending : form.send}
              </button>
            </form>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? labels.close : labels.open}
        className="press flex size-14 items-center justify-center rounded-full bg-gold text-white shadow-lg transition-transform hover:scale-105"
      >
        {open ? (
          <IconX size={26} aria-hidden />
        ) : (
          <IconMessageCircle size={26} aria-hidden />
        )}
      </button>
    </div>
  );
}
