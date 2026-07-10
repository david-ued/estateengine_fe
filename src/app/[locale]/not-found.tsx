'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { btn } from '@/components/ui/styles';
import { getFallbackCopy } from '@/lib/fallback-copy';

export default function LocaleNotFound() {
  const pathname = usePathname();
  const { locale, copy } = getFallbackCopy(pathname);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <p aria-hidden="true" className="text-5xl">
        🏚️
      </p>
      <h1 className="text-2xl font-bold">{copy.notFoundTitle}</h1>
      <p className="text-neutral-500">{copy.notFoundBody}</p>
      <Link href={`/${locale}`} className={`mt-2 ${btn.primary}`}>
        {copy.backHome}
      </Link>
    </main>
  );
}
