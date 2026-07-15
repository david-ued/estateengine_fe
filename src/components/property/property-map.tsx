'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';

function priceLabel(price: number): string {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `$${Math.round(price / 1_000)}K`;
  return `$${price}`;
}

/**
 * 內頁單點地圖：OpenStreetMap + Leaflet，價格 pill 標記（與 listings-map 同款）。
 * Leaflet 依賴 window，僅在瀏覽器 effect 內動態載入。
 */
export function PropertyMap({
  lat,
  lng,
  price,
}: Readonly<{ lat: number; lng: number; price: number }>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let map: import('leaflet').Map | null = null;
    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled) return;

      map = L.map(container, { scrollWheelZoom: false });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      map.setView([lat, lng], 15);

      const icon = L.divIcon({
        className: 'map-pill-wrap',
        html: `<div class="map-pill">${priceLabel(price)}</div>`,
        iconSize: [0, 0],
      });
      L.marker([lat, lng], { icon }).addTo(map);
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng, price]);

  return <div ref={containerRef} className="h-80 w-full sm:h-[26rem]" />;
}
