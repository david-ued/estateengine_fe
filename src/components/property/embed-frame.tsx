'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { toEmbedUrl } from '@/lib/media';

/**
 * 外部影片 / 3D 導覽嵌入（YouTube / Vimeo / Matterport）。
 * 點擊播放才載入 iframe（lazy），同時回報點擊數（PRD 三指標之一）。
 */
export function EmbedFrame({
  mediaId,
  url,
  label,
}: Readonly<{ mediaId: string; url: string; label: string }>) {
  const [active, setActive] = useState(false);

  function handlePlay() {
    setActive(true);
    apiFetch(`/media/${mediaId}/click`, { method: 'POST' }).catch(() => {
      // 追蹤失敗不影響播放
    });
  }

  if (active) {
    return (
      <iframe
        src={toEmbedUrl(url)}
        title={label}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking"
        allowFullScreen
        className="aspect-video w-full rounded-xl border-0"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handlePlay}
      className="flex aspect-video w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
        ▶
      </span>
      <span className="font-medium">{label}</span>
    </button>
  );
}
