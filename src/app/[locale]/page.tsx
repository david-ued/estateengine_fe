import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, locales } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { CITIES } from '@/lib/constants';

/** hreflang alternates（四語系互指） */
export function generateMetadata(): Metadata {
  return {
    alternates: {
      languages: Object.fromEntries(locales.map((locale) => [locale, `/${locale}`])),
    },
  };
}

export default async function HomePage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 overflow-hidden p-8 text-center">
      {/* 背景光暈：柔焦漸層 + 緩慢漂浮，營造景深 */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="float-slow absolute -top-20 left-[15%] size-72 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/15" />
        <div className="float-slower absolute right-[12%] top-[30%] size-80 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/15" />
        <div className="float-slow absolute -bottom-16 left-[40%] size-64 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-400/10" />
      </div>

      <h1 className="fade-up text-4xl font-bold tracking-tight sm:text-6xl">
        {dict.common.appName}
      </h1>
      <p className="fade-up max-w-xl text-lg text-neutral-500 [animation-delay:120ms]">
        {dict.weights.description}
      </p>
      <Link
        href={`/${locale}/properties`}
        className="press fade-up rounded-full bg-neutral-900 px-8 py-3.5 font-medium text-white transition hover:-translate-y-0.5 hover:bg-neutral-700 hover:shadow-xl [animation-delay:240ms] dark:bg-white dark:text-neutral-900"
      >
        {dict.nav.listings}
      </Link>

      {/* 三大城市 chips */}
      <div className="fade-up mt-4 flex flex-wrap items-center justify-center gap-2 [animation-delay:360ms]">
        {CITIES.map((city) => (
          <Link
            key={city}
            href={`/${locale}/properties?city=${city}`}
            className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm text-neutral-500 transition hover:-translate-y-0.5 hover:border-neutral-500 hover:text-neutral-900 hover:shadow-sm dark:border-neutral-700 dark:hover:border-neutral-400 dark:hover:text-white"
          >
            {city}
          </Link>
        ))}
      </div>
    </main>
  );
}
