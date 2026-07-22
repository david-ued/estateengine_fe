'use client';

import { useState } from 'react';
import {
  btn,
  cardClass,
  errorTextClass,
  inputClass,
  selectClass,
  successTextClass,
} from '@/components/ui/styles';
import { apiFetch } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import type { PreApprovalStatus, ProspectFinance } from '@/lib/types';

export interface ReadinessFormLabels {
  statusLabel: string;
  statusOptions: Record<PreApprovalStatus, string>;
  amountLabel: string;
  proofLabel: string;
  noteLabel: string;
  notePlaceholder: string;
  save: string;
  saving: string;
  saved: string;
  error: string;
}

/** 買家自助申報財務準備度：房貸預批 / 額度 / 資產證明 / 補充說明 */
export function ProspectReadinessForm({
  initial,
  labels,
}: Readonly<{ initial: ProspectFinance; labels: ReadinessFormLabels }>) {
  const [status, setStatus] = useState<PreApprovalStatus>(
    initial.pre_approval_status,
  );
  const [amount, setAmount] = useState(
    initial.pre_approval_amount != null ? String(initial.pre_approval_amount) : '',
  );
  const [proof, setProof] = useState(initial.proof_of_funds);
  const [note, setNote] = useState(initial.buyer_note ?? '');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setState('saving');
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');

      const parsedAmount = Number(amount.replaceAll(',', ''));
      await apiFetch('/prospects/me', {
        method: 'PUT',
        token: session.access_token,
        body: JSON.stringify({
          preApprovalStatus: status,
          ...(amount.trim() && Number.isFinite(parsedAmount) && parsedAmount > 0
            ? { preApprovalAmount: parsedAmount }
            : {}),
          proofOfFunds: proof,
          ...(note.trim() ? { buyerNote: note.trim() } : {}),
        }),
      });
      setState('saved');
    } catch {
      setState('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${cardClass} mt-6 max-w-2xl`}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">{labels.statusLabel}</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PreApprovalStatus)}
            className={selectClass}
          >
            {(
              Object.entries(labels.statusOptions) as [PreApprovalStatus, string][]
            ).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">{labels.amountLabel}</span>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1,200,000"
            className={inputClass}
          />
        </label>
      </div>

      <label className="mt-5 flex items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={proof}
          onChange={(e) => setProof(e.target.checked)}
          className="size-4 accent-gold"
        />
        {labels.proofLabel}
      </label>

      <label className="mt-5 flex flex-col gap-2 text-sm">
        <span className="font-medium">{labels.noteLabel}</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={labels.notePlaceholder}
          rows={3}
          className={inputClass}
        />
      </label>

      <div className="mt-6 flex items-center gap-4">
        <button type="submit" disabled={state === 'saving'} className={btn.primary}>
          {state === 'saving' ? labels.saving : labels.save}
        </button>
        {state === 'saved' && (
          <p className={successTextClass}>{labels.saved}</p>
        )}
        {state === 'error' && <p className={errorTextClass}>{labels.error}</p>}
      </div>
    </form>
  );
}
