'use client';

import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import type { Property } from '@/lib/types';

function priceLabel(price: number): string {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `$${Math.round(price / 1_000)}K`;
  return `$${price}`;
}

/** OpenStreetMap + Leaflet 地圖 view，Airbnb 式價格 pill 標記 */
export function ListingsMap({
  locale,
  properties,
}: Readonly<{ locale: string; properties: Property[] }>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const routerRef = useRef(router);

  // render 期間不可寫 ref（react-hooks/refs），改在 effect 內同步
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let map: import('leaflet').Map | null = null;
    let cancelled = false;

    (async () => {
      // Leaflet 依賴 window，僅在瀏覽器動態載入
      const L = (await import('leaflet')).default;
      if (cancelled) return;

      const points = properties.filter(
        (property) => property.lat != null && property.lng != null,
      );

      map = L.map(container, { scrollWheelZoom: true });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      if (points.length === 0) {
        map.setView([49.2827, -123.1207], 10); // Vancouver fallback
        return;
      }

      map.fitBounds(
        L.latLngBounds(points.map((p) => [p.lat!, p.lng!] as [number, number])),
        { padding: [48, 48], maxZoom: 14 },
      );

      for (const property of points) {
        const icon = L.divIcon({
          className: 'map-pill-wrap',
          html: `<div class="map-pill">${priceLabel(Number(property.price))}</div>`,
          iconSize: [0, 0],
        });
        const marker = L.marker([property.lat!, property.lng!], { icon }).addTo(map);
        marker.bindTooltip(property.title, { direction: 'top', offset: [0, -16] });
        marker.on('click', () =>
          routerRef.current.push(`/${locale}/properties/${property.id}`),
        );
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [locale, properties]);

  return <div ref={containerRef} className="size-full" />;
}
