'use client';

import { useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

/**
 * 簡易數據追蹤：進頁 pageview +1；離頁回報停留秒數（keepalive fetch）。
 */
export function ViewTracker({ propertyId }: Readonly<{ propertyId: string }>) {
  useEffect(() => {
    const start = Date.now();

    fetch(`${API_BASE_URL}/properties/${propertyId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }).catch(() => {});

    function reportDuration() {
      const durationSeconds = Math.round((Date.now() - start) / 1000);
      if (durationSeconds < 1) return;
      fetch(`${API_BASE_URL}/properties/${propertyId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationSeconds }),
        keepalive: true,
      }).catch(() => {});
    }

    window.addEventListener('pagehide', reportDuration);
    return () => {
      window.removeEventListener('pagehide', reportDuration);
      reportDuration();
    };
  }, [propertyId]);

  return null;
}
