'use client';

import { IconBookmark } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { errorTextClass, inputClass, successTextClass } from '@/components/ui/styles';
import type { Dictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

type Status = 'idle' | 'saving' | 'success' | 'error';

/**
 * 儲存搜尋（filter bar 右側）：
 * 未登入 → 按鈕提示 saveSearchLogin 並導向登入頁（同 FavoriteButton 模式）；
 * 已登入 → 小彈出框輸入名稱，POST /saved-searches {name, params}，
 * params = 目前 URL 的 query object（去除分頁）。
 */
export function SaveSearchButton({
  locale,
  labels,
  common,
}: Readonly<{
  locale: string;
  labels: Pick<
    Dictionary['search'],
    | 'saveSearch'
    | 'saveSearchTitle'
    | 'saveSearchNamePlaceholder'
    | 'saveSearchSuccess'
    | 'saveSearchError'
    | 'saveSearchLogin'
  >;
  common: Pick<Dictionary['common'], 'save' | 'cancel'>;
}>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  // 登入狀態僅在瀏覽器端偵測（根 layout 為靜態，同 NavAuth 模式）
  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.session));
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSignedIn(Boolean(session));
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  function handleTriggerClick() {
    if (!signedIn) {
      router.push(`/${locale}/login`);
      return;
    }
    setStatus('idle');
    setOpen((prev) => !prev);
  }

  function closePopover() {
    setOpen(false);
    setStatus('idle');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || status === 'saving') return;

    setStatus('saving');
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        router.push(`/${locale}/login`);
        return;
      }

      // params = 目前 URL 的 query object；分頁不屬於搜尋條件故略過
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        if (key !== 'page') params[key] = value;
      });

      await apiFetch('/saved-searches', {
        method: 'POST',
        token,
        body: JSON.stringify({ name: trimmed, params }),
      });
      setName('');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  const label = signedIn ? labels.saveSearch : labels.saveSearchLogin;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleTriggerClick}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={label}
        aria-label={label}
        className="press inline-flex h-10 items-center gap-1.5 border border-neutral-300 bg-white px-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-700 transition-colors hover:border-gold hover:text-gold dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200"
      >
        <IconBookmark size={15} aria-hidden />
        {labels.saveSearch}
      </button>

      {open && (
        <>
          {/* 透明遮罩：點外側收合 */}
          <div className="fixed inset-0 z-10" onClick={closePopover} aria-hidden="true" />
          <div className="absolute right-0 top-full z-20 mt-2 w-72 border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-950">
            <form onSubmit={handleSubmit}>
              <h3 className="text-sm font-semibold">{labels.saveSearchTitle}</h3>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={labels.saveSearchNamePlaceholder}
                maxLength={80}
                autoFocus
                className={`${inputClass} mt-3`}
              />
              {status === 'success' && (
                <p className={`${successTextClass} mt-2`}>{labels.saveSearchSuccess}</p>
              )}
              {status === 'error' && (
                <p className={`${errorTextClass} mt-2`}>{labels.saveSearchError}</p>
              )}
              <div className="mt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closePopover}
                  className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500 transition-colors hover:text-gold"
                >
                  {common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={status === 'saving' || name.trim() === ''}
                  className="press btn-primary inline-flex items-center justify-center px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] disabled:cursor-not-allowed"
                >
                  {common.save}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
