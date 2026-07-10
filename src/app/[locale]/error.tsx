'use client';

import { IconAlertTriangle } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { btn } from '@/components/ui/styles';
import { getFallbackCopy } from '@/lib/fallback-copy';

export default function LocaleError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  const pathname = usePathname();
  const { locale, copy } = getFallbackCopy(pathname);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <IconAlertTriangle
        size={48}
        aria-hidden="true"
        className="text-accent"
      />
      <h1 className="text-2xl font-bold">{copy.errorTitle}</h1>
      <p className="text-neutral-500">{copy.errorBody}</p>
      <div className="mt-2 flex items-center gap-3">
        <button type="button" onClick={reset} className={btn.primary}>
          {copy.retry}
        </button>
        <Link href={`/${locale}`} className={btn.secondary}>
          {copy.backHome}
        </Link>
      </div>
    </main>
  );
}
