'use client';

import {
  IconBrandFacebook,
  IconBrandLinkedin,
  IconBrandX,
  IconCheck,
  IconLink,
  IconThumbUp,
  IconThumbUpFilled,
} from '@tabler/icons-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';

/** 文章互動字典（頁面注入，避免 client 端載入整份字典） */
export interface ArticleActionLabels {
  clap: string;
  shareOnX: string;
  shareOnFacebook: string;
  shareOnLinkedin: string;
  copyLink: string;
  copied: string;
}

/**
 * 掛載後把子節點 portal 到 <body>。
 * 專欄版面外層 .page-in 有殘留 transform，會成為 fixed 的容器塊；
 * portal 到 body 才能讓進度條、浮動列真正相對視窗定位。
 */
const emptySubscribe = () => () => {};

/** SSR / 首次 hydration 回傳 false，client 掛載後 true（不需 effect setState） */
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

function BodyPortal({ children }: Readonly<{ children: React.ReactNode }>) {
  const mounted = useMounted();
  return mounted ? createPortal(children, document.body) : null;
}

/* ---------------------------------------------------------------
   閱讀進度條：固定於視窗頂端，隨捲動填滿金色線
--------------------------------------------------------------- */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function update() {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0);
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <BodyPortal>
      <div
        className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent"
        role="progressbar"
        aria-label="閱讀進度"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div
          className="h-full origin-left bg-gold"
          style={{
            transform: `scaleX(${progress})`,
            transition: 'transform 75ms linear',
          }}
        />
      </div>
    </BodyPortal>
  );
}

/* ---------------------------------------------------------------
   拍手數：localStorage 保存（無後端），跨實例即時同步
--------------------------------------------------------------- */
const MAX_CLAPS = 50;
const clapKey = (slug: string) => `ee_blog_claps_${slug}`;

function useClaps(slug: string) {
  const [claps, setClaps] = useState(0);

  useEffect(() => {
    const read = () => {
      const raw = window.localStorage.getItem(clapKey(slug));
      setClaps(raw ? Number(raw) || 0 : 0);
    };
    read();
    // 跨分頁同步（同分頁的浮動列與文末列因斷點互斥，不會同時顯示）
    const onStorage = (e: StorageEvent) => {
      if (e.key === clapKey(slug)) read();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [slug]);

  const addClap = useCallback(() => {
    setClaps((prev) => {
      const next = Math.min(MAX_CLAPS, prev + 1);
      if (next === prev) return prev;
      try {
        window.localStorage.setItem(clapKey(slug), String(next));
      } catch {
        // localStorage 不可用時僅保留本地狀態
      }
      return next;
    });
  }, [slug]);

  return { claps, addClap, maxed: claps >= MAX_CLAPS };
}

/* ---------------------------------------------------------------
   Medium 式互動列：拍手 + 分享（浮動直列 / 內文末橫列）
--------------------------------------------------------------- */
export function ArticleActions({
  slug,
  title,
  labels,
  variant = 'rail',
}: Readonly<{
  slug: string;
  title: string;
  labels: ArticleActionLabels;
  /** rail = 桌機右側浮動直列；inline = 文末置中橫列 */
  variant?: 'rail' | 'inline';
}>) {
  const { claps, addClap, maxed } = useClaps(slug);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const shareUrl = () =>
    typeof window === 'undefined' ? '' : window.location.href;

  const openShare = (href: string) => {
    window.open(href, '_blank', 'noopener,noreferrer,width=600,height=520');
  };

  const shareX = () =>
    openShare(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        title,
      )}&url=${encodeURIComponent(shareUrl())}`,
    );

  const shareFacebook = () =>
    openShare(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl(),
      )}`,
    );

  const shareLinkedin = () =>
    openShare(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        shareUrl(),
      )}`,
    );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // 剪貼簿不可用（非安全來源等）時靜默略過
    }
  }

  const isRail = variant === 'rail';

  // 圓形圖示鈕（兩種版型共用外觀）。neutral / active 互斥，避免 text-* 與 border-* 衝突。
  const iconBtnBase =
    'inline-flex size-10 items-center justify-center rounded-full border bg-white shadow-sm transition-colors hover:border-gold hover:text-gold dark:bg-neutral-950';
  const iconNeutral =
    'border-neutral-200 text-neutral-600 dark:border-neutral-800 dark:text-neutral-300';
  const iconActive = 'border-gold text-gold';
  const iconBtn = `${iconBtnBase} ${iconNeutral}`;

  const content = (
    <div
      className={
        isRail
          ? 'fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex'
          : 'flex items-center justify-center gap-3 lg:hidden'
      }
    >
      {/* 拍手 */}
      <div
        className={
          isRail ? 'flex flex-col items-center gap-1' : 'flex items-center gap-2'
        }
      >
        <button
          type="button"
          onClick={addClap}
          disabled={maxed}
          aria-label={labels.clap}
          title={labels.clap}
          className={`${iconBtnBase} ${
            claps > 0 ? iconActive : iconNeutral
          } disabled:cursor-default disabled:opacity-60`}
        >
          {claps > 0 ? (
            <IconThumbUpFilled size={19} aria-hidden />
          ) : (
            <IconThumbUp size={19} aria-hidden />
          )}
        </button>
        <span className="text-xs font-semibold tabular-nums text-neutral-500 dark:text-neutral-400">
          {claps}
        </span>
      </div>

      {/* 分隔 */}
      <span
        className={
          isRail
            ? 'my-1 h-px w-6 bg-neutral-200 dark:bg-neutral-800'
            : 'mx-1 h-6 w-px bg-neutral-200 dark:bg-neutral-800'
        }
        aria-hidden
      />

      {/* 分享 */}
      <button
        type="button"
        onClick={shareX}
        aria-label={labels.shareOnX}
        title={labels.shareOnX}
        className={iconBtn}
      >
        <IconBrandX size={18} aria-hidden />
      </button>
      <button
        type="button"
        onClick={shareFacebook}
        aria-label={labels.shareOnFacebook}
        title={labels.shareOnFacebook}
        className={iconBtn}
      >
        <IconBrandFacebook size={18} aria-hidden />
      </button>
      <button
        type="button"
        onClick={shareLinkedin}
        aria-label={labels.shareOnLinkedin}
        title={labels.shareOnLinkedin}
        className={iconBtn}
      >
        <IconBrandLinkedin size={18} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => void copyLink()}
        aria-label={copied ? labels.copied : labels.copyLink}
        title={copied ? labels.copied : labels.copyLink}
        className={`${iconBtnBase} ${copied ? iconActive : iconNeutral}`}
      >
        {copied ? (
          <IconCheck size={18} aria-hidden />
        ) : (
          <IconLink size={18} aria-hidden />
        )}
      </button>
    </div>
  );

  // 浮動列需逃離 .page-in 的 transform 容器塊；文末橫列維持原地。
  return isRail ? <BodyPortal>{content}</BodyPortal> : content;
}
