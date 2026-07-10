import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { isLocale, locales } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import '../globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'EstateEngine',
    template: '%s | EstateEngine',
  },
  description: 'Personalized home-search platform for agents and buyers.',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-neutral-200/70 bg-white/75 px-4 py-4 backdrop-blur-md sm:px-8 dark:border-neutral-800/70 dark:bg-neutral-950/75">
          <Link
            href={`/${locale}`}
            className="font-bold tracking-tight text-brand transition-opacity hover:opacity-70"
          >
            {dict.common.appName}
          </Link>
          <div className="flex items-center gap-4 text-sm sm:gap-6">
            <Link href={`/${locale}/properties`} className="hover:underline">
              {dict.nav.listings}
            </Link>
            <Link href={`/${locale}/agents`} className="hover:underline">
              {dict.nav.agents}
            </Link>
            <LocaleSwitcher current={locale} />
            <Link
              href={`/${locale}/login`}
              className="press btn-primary rounded-full px-4 py-1.5"
            >
              {dict.nav.signIn}
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
