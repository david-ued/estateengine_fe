'use client';

import { IconCheck, IconShare2 } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

/**
 * 分享目前物件：支援系統分享面板則優先叫用，否則複製網址到剪貼簿。
 * （字典無「已複製」文案 key，改以打勾圖示做視覺回饋）
 */
export function ShareButton({ label }: Readonly<{ label: string }>) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  async function handleShare() {
    const url = window.location.href;

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: document.title, url });
      } catch {
        // 使用者取消分享 → 不再 fallback
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // 剪貼簿不可用（非安全來源等）時靜默略過
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      title={label}
      className="press inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-600 transition-colors hover:text-gold dark:text-neutral-300"
    >
      {copied ? (
        <IconCheck size={18} className="text-gold" aria-hidden />
      ) : (
        <IconShare2 size={18} aria-hidden />
      )}
      {label}
    </button>
  );
}
