'use client';

import { IconHeart, IconHeartFilled } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useFavorites } from './favorites-provider';

/**
 * 收藏愛心（列表卡右上角 / 內頁 Save）。
 * 未登入時導向登入頁；登入後樂觀切換。
 */
export function FavoriteButton({
  propertyId,
  locale,
  labels,
  variant = 'overlay',
}: Readonly<{
  propertyId: string;
  locale: string;
  labels: Readonly<{ add: string; remove: string; loginToSave: string }>;
  /** overlay = 照片右上角圓鈕；inline = 內頁文字鈕 */
  variant?: 'overlay' | 'inline';
}>) {
  const { signedIn, ids, toggle } = useFavorites();
  const router = useRouter();

  const isFavorite = ids.has(propertyId);
  const label = signedIn
    ? isFavorite
      ? labels.remove
      : labels.add
    : labels.loginToSave;

  function handleClick(event: React.MouseEvent) {
    // 卡片整體是連結，避免點愛心誤入內頁
    event.preventDefault();
    event.stopPropagation();
    if (!signedIn) {
      router.push(`/${locale}/login`);
      return;
    }
    void toggle(propertyId);
  }

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        aria-pressed={isFavorite}
        title={label}
        className="press inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-600 transition-colors hover:text-gold dark:text-neutral-300"
      >
        {isFavorite ? (
          <IconHeartFilled size={18} className="text-gold" aria-hidden />
        ) : (
          <IconHeart size={18} aria-hidden />
        )}
        {isFavorite ? labels.remove : labels.add}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      aria-pressed={isFavorite}
      title={label}
      className="press absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
    >
      {isFavorite ? (
        <IconHeartFilled size={18} className="text-gold-soft" aria-hidden />
      ) : (
        <IconHeart size={18} aria-hidden />
      )}
    </button>
  );
}
