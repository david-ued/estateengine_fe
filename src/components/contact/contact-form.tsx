'use client';

import { useState } from 'react';
import {
  btn,
  errorTextClass,
  inputClass,
  successTextClass,
} from '@/components/ui/styles';
import type { Dictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';

type Status = 'idle' | 'pending' | 'success' | 'error';

/**
 * 聯絡表單（公開，免登入）：POST /contact 寫入 contact_messages。
 * 由物件內頁帶 ?property=<uuid>&title=<標題> 進來時，顯示詢問物件提示條
 * 並隨表單送出 propertyId。
 */
export function ContactForm({
  locale,
  labels,
  propertyId,
  propertyTitle,
}: Readonly<{
  locale: string;
  labels: Dictionary['contact'];
  propertyId?: string;
  propertyTitle?: string;
}>) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [casl, setCasl] = useState(false);
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('pending');

    try {
      await apiFetch<unknown>('/contact', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          message,
          propertyId,
          locale,
          caslConsent: casl,
        }),
      });
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setCasl(false);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      {propertyTitle && (
        <div className="border border-gold/40 bg-gold/5 px-4 py-3">
          <p className="eyebrow">{labels.aboutProperty}</p>
          <p className="mt-1 text-sm font-medium">{propertyTitle}</p>
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm">
        {labels.name}
        <input
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {labels.email}
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {labels.phone}
        <input
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {labels.message}
        <textarea
          required
          rows={6}
          placeholder={labels.messagePlaceholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={inputClass}
        />
      </label>

      {/* CASL：明示同意（送出必勾），後端記 casl_consent_at */}
      <label className="flex items-start gap-2 text-xs leading-relaxed text-neutral-500">
        <input
          type="checkbox"
          required
          checked={casl}
          onChange={(e) => setCasl(e.target.checked)}
          className="mt-0.5 size-4 shrink-0"
        />
        {labels.caslConsent}
      </label>

      {status === 'success' && (
        <p className={successTextClass} role="status">
          {labels.success}
        </p>
      )}
      {status === 'error' && (
        <p className={errorTextClass} role="alert">
          {labels.error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'pending'}
        className={`${btn.primary} self-start`}
      >
        {status === 'pending' ? labels.sending : labels.send}
      </button>
    </form>
  );
}
