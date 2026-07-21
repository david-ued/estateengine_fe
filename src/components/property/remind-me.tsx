'use client';

import { IconBellRinging } from '@tabler/icons-react';
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
 * 預售屋 CTA：取代「詢問此物件」的「提醒我」登記。
 * 目前寫入 contact_messages（agent 收件匣可見）；
 * 之後串 email service 時以 remindMessage 前綴辨識提醒登記。
 */
export function RemindMe({
  locale,
  propertyId,
  propertyTitle,
  labels,
  defaultName,
  defaultEmail,
}: Readonly<{
  locale: string;
  propertyId: string;
  propertyTitle: string;
  labels: Dictionary['property'];
  defaultName?: string;
  defaultEmail?: string;
}>) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(defaultName ?? '');
  const [email, setEmail] = useState(defaultEmail ?? '');
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
          message: labels.remindMessage.replace('{title}', propertyTitle),
          propertyId,
          locale,
          caslConsent: casl,
        }),
      });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <p className={`${successTextClass} mt-6`} role="status">
        {labels.remindSuccess}
      </p>
    );
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={`${btn.primary} mt-6 w-full`}
      >
        <IconBellRinging size={16} aria-hidden /> {labels.remindCta}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
      <p className="text-sm font-medium">{labels.remindTitle}</p>
      <p className="text-sm leading-relaxed text-neutral-500">
        {labels.remindBody}
      </p>
      <label className="flex flex-col gap-1 text-xs text-neutral-600 dark:text-neutral-400">
        {labels.remindName}
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
        {labels.remindEmail}
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </label>
      {/* CASL：提醒登記本質是行銷 email，必須明示同意（後端記 casl_consent_at） */}
      <label className="flex items-start gap-2 text-xs leading-relaxed text-neutral-500">
        <input
          type="checkbox"
          required
          checked={casl}
          onChange={(e) => setCasl(e.target.checked)}
          className="mt-0.5 size-4 shrink-0"
        />
        {labels.remindConsent}
      </label>
      {status === 'error' && (
        <p className={errorTextClass} role="alert">
          {labels.remindError}
        </p>
      )}
      <button
        type="submit"
        disabled={status === 'pending'}
        className={`${btn.primary} w-full`}
      >
        {status === 'pending' ? labels.remindSending : labels.remindSubmit}
      </button>
    </form>
  );
}
