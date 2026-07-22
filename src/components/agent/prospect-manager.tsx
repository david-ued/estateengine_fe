'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  badgeClass,
  btn,
  cardClass,
  errorTextClass,
  inputClass,
  selectClass,
  successTextClass,
} from '@/components/ui/styles';
import { apiFetch } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type {
  InterestDecision,
  InterestProperty,
  PreApprovalStatus,
  ProspectDetail,
  ProspectFinance,
  PropertyInterest,
} from '@/lib/types';

export interface ProspectManagerLabels {
  financeTitle: string;
  preApproval: Record<PreApprovalStatus, string>;
  statusLabel: string;
  amountLabel: string;
  proofLabel: string;
  agentNoteLabel: string;
  buyerNoteLabel: string;
  save: string;
  saving: string;
  saved: string;
  error: string;
  interestsTitle: string;
  interestsIntro: string;
  interestsEmpty: string;
  decision: Record<InterestDecision, string>;
  decisionLabel: string;
  actFastLabel: string;
  actFastBadge: string;
  interestNotePlaceholder: string;
  unavailable: string;
  updated: string;
}

async function authedFetch<T>(path: string, body: unknown, method: string) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('no session');
  return apiFetch<T>(path, {
    method,
    token: session.access_token,
    body: JSON.stringify(body),
  });
}

/** 決策徽章配色（與買家端一致） */
const DECISION_BADGE: Record<InterestDecision, string> = {
  considering: 'border border-neutral-300 text-neutral-500 dark:border-neutral-700',
  locked_in: 'bg-ink text-gold-soft',
  walked_away: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-900',
};

// ---------- 財務準備度卡片 ----------

function FinanceCard({
  userId,
  finance,
  labels,
}: Readonly<{
  userId: string;
  finance: ProspectFinance;
  labels: ProspectManagerLabels;
}>) {
  const [status, setStatus] = useState<PreApprovalStatus>(
    finance.pre_approval_status,
  );
  const [amount, setAmount] = useState(
    finance.pre_approval_amount != null ? String(finance.pre_approval_amount) : '',
  );
  const [proof, setProof] = useState(finance.proof_of_funds);
  const [note, setNote] = useState(finance.agent_note ?? '');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setState('saving');
    try {
      const parsed = Number(amount.replaceAll(',', ''));
      await authedFetch(
        `/prospects/${userId}`,
        {
          preApprovalStatus: status,
          preApprovalAmount:
            amount.trim() && Number.isFinite(parsed) && parsed > 0 ? parsed : 0,
          proofOfFunds: proof,
          agentNote: note,
        },
        'PATCH',
      );
      setState('saved');
    } catch {
      setState('error');
    }
  }

  return (
    <form onSubmit={save} className={cardClass}>
      <h3 className="eyebrow">{labels.financeTitle}</h3>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">{labels.statusLabel}</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PreApprovalStatus)}
            className={selectClass}
          >
            {(
              Object.entries(labels.preApproval) as [PreApprovalStatus, string][]
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

      {finance.buyer_note && (
        <div className="mt-5 border-l-2 border-gold bg-cream px-4 py-3 text-sm dark:bg-neutral-900">
          <p className="eyebrow text-[10px]">{labels.buyerNoteLabel}</p>
          <p className="mt-1.5 whitespace-pre-wrap">{finance.buyer_note}</p>
        </div>
      )}

      <label className="mt-5 flex flex-col gap-2 text-sm">
        <span className="font-medium">{labels.agentNoteLabel}</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className={inputClass}
        />
      </label>

      <div className="mt-6 flex items-center gap-4">
        <button type="submit" disabled={state === 'saving'} className={btn.primary}>
          {state === 'saving' ? labels.saving : labels.save}
        </button>
        {state === 'saved' && <p className={successTextClass}>{labels.saved}</p>}
        {state === 'error' && <p className={errorTextClass}>{labels.error}</p>}
      </div>
    </form>
  );
}

// ---------- 單一物件表態 / Act Fast 列 ----------

export interface AgentInterestRowData {
  property: InterestProperty;
  decision: InterestDecision;
  act_fast: boolean;
  agent_note: string | null;
  updated_at: string | null;
}

function InterestRow({
  userId,
  locale,
  row,
  labels,
}: Readonly<{
  userId: string;
  locale: string;
  row: AgentInterestRowData;
  labels: ProspectManagerLabels;
}>) {
  const [decision, setDecision] = useState(row.decision);
  const [actFast, setActFast] = useState(row.act_fast);
  const [note, setNote] = useState(row.agent_note ?? '');
  // 最後一次存檔成功的值：dirty 比對基準（props 不可變）
  const [savedValues, setSavedValues] = useState({
    decision: row.decision,
    actFast: row.act_fast,
    note: row.agent_note ?? '',
  });
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );

  const dirty =
    decision !== savedValues.decision ||
    actFast !== savedValues.actFast ||
    note !== savedValues.note;

  async function save() {
    setState('saving');
    try {
      await authedFetch<PropertyInterest>(
        `/prospects/${userId}/interests/${row.property.id}`,
        { decision, actFast, agentNote: note },
        'PUT',
      );
      setSavedValues({ decision, actFast, note });
      setState('saved');
    } catch {
      setState('error');
    }
  }

  const { property } = row;

  return (
    <li className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/${locale}/properties/${property.id}`}
          className="font-medium transition-colors hover:text-gold"
        >
          {property.title}
        </Link>
        {property.status !== 'published' && (
          <span
            className={`${badgeClass} border border-neutral-300 text-neutral-500 dark:border-neutral-700`}
          >
            {labels.unavailable}
          </span>
        )}
        <span className={cn(badgeClass, DECISION_BADGE[decision])}>
          {labels.decision[decision]}
        </span>
        {actFast && (
          <span className={`${badgeClass} border border-gold text-gold`}>
            {labels.actFastBadge}
          </span>
        )}
      </div>
      <p className="text-sm text-neutral-500">
        {property.city}
        {property.district ? ` · ${property.district}` : ''} · $
        {Number(property.price).toLocaleString(locale)}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-neutral-500">{labels.decisionLabel}</span>
          <select
            value={decision}
            onChange={(e) => setDecision(e.target.value as InterestDecision)}
            className={selectClass}
          >
            {(
              Object.entries(labels.decision) as [InterestDecision, string][]
            ).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={actFast}
            onChange={(e) => setActFast(e.target.checked)}
            className="size-4 accent-gold"
          />
          {labels.actFastLabel}
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={labels.interestNotePlaceholder}
          className={`${inputClass} max-w-md`}
        />
        <button
          type="button"
          onClick={save}
          disabled={!dirty || state === 'saving'}
          className={btn.quiet}
        >
          {state === 'saving' ? labels.saving : labels.save}
        </button>
        {state === 'saved' && !dirty && (
          <span className={successTextClass}>{labels.saved}</span>
        )}
        {state === 'error' && (
          <span className={errorTextClass}>{labels.error}</span>
        )}
      </div>
    </li>
  );
}

// ---------- 整合面板 ----------

/**
 * Prospect 管理面板：財務準備度（agent 可代為更新 + 內部備註）
 * 與物件表態清單（決策 / Act Fast / 洽談備註）。
 * 清單 = 買家已表態 + 收藏未表態（後者存檔時自動建立表態列）。
 */
export function ProspectManager({
  locale,
  detail,
  labels,
}: Readonly<{
  locale: string;
  detail: ProspectDetail;
  labels: ProspectManagerLabels;
}>) {
  const decided = new Set(detail.interests.map((i) => i.property.id));
  const rows: AgentInterestRowData[] = [
    ...detail.interests.map((i) => ({
      property: i.property,
      decision: i.decision,
      act_fast: i.act_fast,
      agent_note: i.agent_note ?? null,
      updated_at: i.updated_at,
    })),
    ...detail.favorites
      .filter((f) => !decided.has(f.property.id))
      .map((f) => ({
        property: f.property,
        decision: 'considering' as const,
        act_fast: false,
        agent_note: null,
        updated_at: null,
      })),
  ];

  return (
    <div className="flex flex-col gap-10">
      <FinanceCard
        userId={detail.buyer.id}
        finance={detail.finance}
        labels={labels}
      />

      <section>
        <h3 className="eyebrow">{labels.interestsTitle}</h3>
        <p className="mt-3 max-w-2xl text-sm text-neutral-500">
          {labels.interestsIntro}
        </p>
        {rows.length === 0 ? (
          <p className="mt-6 border border-neutral-200 px-6 py-12 text-center text-neutral-500 dark:border-neutral-800">
            {labels.interestsEmpty}
          </p>
        ) : (
          <ul className="mt-6 flex flex-col divide-y divide-neutral-200 border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {rows.map((row) => (
              <InterestRow
                key={row.property.id}
                userId={detail.buyer.id}
                locale={locale}
                row={row}
                labels={labels}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
