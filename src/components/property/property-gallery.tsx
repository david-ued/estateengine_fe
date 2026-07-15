'use client';

import { useState } from 'react';

export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
}

/**
 * 內頁大圖 gallery（參考站樣式）：16:9 主圖 + 底下橫向縮圖列，
 * 點縮圖切換主圖；主圖以 key 重掛觸發 fade-in。
 */
export function PropertyGallery({ images }: Readonly<{ images: GalleryImage[] }>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[Math.min(activeIndex, images.length - 1)];
  if (!active) return null;

  return (
    <div>
      <div className="overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 遠端圖 */}
        <img
          key={active.id}
          src={active.url}
          alt={active.alt}
          className="fade-in aspect-video w-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={image.alt}
              aria-current={index === activeIndex}
              className={`w-24 shrink-0 overflow-hidden border-2 transition sm:w-28 ${
                index === activeIndex
                  ? 'border-gold'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 遠端圖 */}
              <img
                src={image.url}
                alt=""
                className="aspect-[4/3] w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
