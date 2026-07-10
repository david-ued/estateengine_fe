'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { btn, cardClass, errorTextClass, inputClass } from '@/components/ui/styles';
import type { Dictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

export interface ShareLinkListing {
  id: string;
  title: string;
  city: string;
  status: string;
}

export interface ExistingShareLink {
  id: string;
  slug: string;
  title: string | null;
  click_count: number;
}

export function ShareLinkManager({
  locale,
  labels,
  listings,
  links,
}: Readonly<{
  locale: string;
  labels: Dictionary['shareLinks'];
  listings: ShareLinkListing[];
  links: ExistingShareLink[];
}>) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // clipboard API 不可用時，改顯示唯讀輸入框讓使用者手動複製
  const [manualCopyId, setManualCopyId] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (selected.size === 0) {
      setError(labels.needSelection);
      return;
    }
    setPending(true);

    const form = new FormData(event.currentTarget);
    const text = (name: string) => {
      const value = form.get(name);
      return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
    };

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');

      await apiFetch('/share-links', {
        method: 'POST',
        body: JSON.stringify({
          propertyIds: [...selected],
          title: text('title'),
          ogTitle: text('ogTitle'),
          ogDescription: text('ogDescription'),
        }),
        token: session.access_token,
      });

      setSelected(new Set());
      (event.target as HTMLFormElement).reset();
      router.refresh();
    } catch {
      setError(labels.createError);
    } finally {
      setPending(false);
    }
  }

  function shareUrl(link: ExistingShareLink) {
    return `${window.location.origin}/${locale}/share/${link.slug}`;
  }

  async function copyLink(link: ExistingShareLink) {
    try {
      await navigator.clipboard.writeText(shareUrl(link));
      setCopiedId(link.id);
      setManualCopyId(null);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // clipboard 不可用時顯示行內唯讀輸入框（不使用原生對話框）
      setManualCopyId(link.id);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 建立推薦清單 */}
      <form onSubmit={handleCreate} className={`${cardClass} flex flex-col gap-4`}>
        <h2 className="font-semibold">{labels.createTitle}</h2>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-xs text-neutral-500">{labels.selectHint}</legend>
          {listings.map((listing) => (
            <label
              key={listing.id}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
            >
              <input
                type="checkbox"
                checked={selected.has(listing.id)}
                onChange={() => toggle(listing.id)}
                className="size-4"
              />
              <span className="flex-1 truncate">{listing.title}</span>
              <span className="text-xs text-neutral-500">{listing.city}</span>
            </label>
          ))}
        </fieldset>

        <label className="flex flex-col gap-1 text-sm">
          {labels.listTitleLabel}
          <input name="title" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {labels.ogTitle}
          <input name="ogTitle" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {labels.ogDescription}
          <textarea name="ogDescription" rows={2} className={inputClass} />
        </label>

        {error && <p className={errorTextClass}>{error}</p>}
        <button type="submit" disabled={pending} className={btn.primary}>
          {pending ? labels.creating : labels.create}
        </button>
      </form>

      {/* 既有連結 */}
      <section className={cardClass}>
        <h2 className="mb-3 font-semibold">{labels.myLinks}</h2>
        {links.length === 0 ? (
          <p className="text-sm text-neutral-500">{labels.empty}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {links.map((link) => (
              <li
                key={link.id}
                className="flex flex-col gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
              >
                <div className="flex items-center gap-3">
                  <span className="flex-1 truncate">
                    {link.title ?? `/share/${link.slug}`}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {labels.clicks}: {link.click_count}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyLink(link)}
                    className={btn.quiet}
                  >
                    {copiedId === link.id ? labels.copied : labels.copy}
                  </button>
                </div>
                {/* 聚焦即全選，使用者按複製快捷鍵即可 */}
                {manualCopyId === link.id && (
                  <input
                    readOnly
                    value={shareUrl(link)}
                    aria-label={labels.copy}
                    onFocus={(e) => e.currentTarget.select()}
                    autoFocus
                    className={`${inputClass} text-xs`}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
