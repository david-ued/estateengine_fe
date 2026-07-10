'use client';

import { IconBolt, IconPhoto, IconSparkles } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import {
  btn,
  errorTextClass,
  inputClass,
  successTextClass,
} from '@/components/ui/styles';
import type { Dictionary } from '@/i18n/get-dictionary';
import { apiFetch, ApiError } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

interface ParseResult {
  fields: Record<string, unknown>;
  balance: number;
  cost: number;
}

/** ⚡ AI 快速建檔：貼文字或截圖 → Gemini 解析 → 自動填表（扣平台 Token 點數） */
export function AiQuickFill({
  labels,
  onFilled,
}: Readonly<{
  labels: Dictionary['ai'];
  onFilled: (fields: Record<string, unknown>) => void;
}>) {
  const [text, setText] = useState('');
  const [image, setImage] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [cost, setCost] = useState(5);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session || cancelled) return;
        const result = await apiFetch<{ balance: number; cost: number }>('/ai/tokens', {
          token: session.access_token,
        });
        if (!cancelled) {
          setBalance(result.balance);
          setCost(result.cost);
        }
      } catch {
        // 後端未設定 AI 時保持 null，按鈕仍可嘗試並顯示錯誤
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImage({
        base64: dataUrl.slice(dataUrl.indexOf(',') + 1),
        mimeType: file.type,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  }

  const insufficient = balance !== null && balance < cost;
  const disabled = pending || insufficient || (!text.trim() && !image);

  async function handleParse() {
    setPending(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');

      const result = await apiFetch<ParseResult>('/ai/parse-listing', {
        method: 'POST',
        body: JSON.stringify({
          text: text.trim() || undefined,
          imageBase64: image?.base64,
          imageMimeType: image?.mimeType,
        }),
        token: session.access_token,
      });

      setBalance(result.balance);
      onFilled(result.fields);
      setMessage({ kind: 'success', text: labels.filled });
    } catch (error) {
      if (error instanceof ApiError && error.status === 402) {
        setMessage({ kind: 'error', text: labels.insufficient });
      } else {
        setMessage({ kind: 'error', text: labels.error });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-2xl border-2 border-dashed border-brand/40 bg-brand/5 p-4 sm:p-5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 font-semibold text-brand">
          <IconBolt size={20} /> {labels.title}
        </h2>
        <span className="text-xs text-neutral-500">
          {labels.balance}:{' '}
          <strong className={insufficient ? 'text-red-600' : 'text-brand'}>
            {balance ?? '—'}
          </strong>{' '}
          · {labels.cost.replace('{n}', String(cost))}
        </span>
      </div>
      <p className="mb-3 text-xs text-neutral-500">{labels.hint}</p>

      {/* 區塊底色為品牌淡色，輸入框需保持白底以利閱讀 */}
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={labels.placeholder}
        className={`${inputClass} bg-white dark:bg-neutral-900`}
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label
          className={`${btn.secondary} cursor-pointer bg-white dark:bg-neutral-900`}
        >
          <IconPhoto size={16} />
          {image ? image.name : labels.uploadImage}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImage}
            className="hidden"
          />
        </label>
        <button
          type="button"
          disabled={disabled}
          onClick={handleParse}
          className={`${btn.primary} ml-auto`}
        >
          <IconSparkles size={16} />
          {pending ? labels.parsing : labels.parse}
        </button>
      </div>

      {insufficient && (
        <p className={`mt-2 ${errorTextClass}`}>{labels.insufficient}</p>
      )}
      {message && (
        <p
          className={`mt-2 ${
            message.kind === 'error' ? errorTextClass : successTextClass
          }`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}
