import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NavAuth } from '@/components/auth/nav-auth';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { NavLinks } from '@/components/nav-links';
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
        <nav className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-neutral-200/70 bg-white/75 px-4 py-4 backdrop-blur-md sm:px-8 dark:border-neutral-800/70 dark:bg-neutral-950/75">
          <Link
            href={`/${locale}`}
            className="shrink-0 font-bold tracking-tight text-brand transition-opacity hover:opacity-70"
          >
            {dict.common.appName}
          </Link>
          <div className="flex min-w-0 items-center gap-3 text-sm sm:gap-6">
            <NavLinks
              links={[
                { href: `/${locale}/properties`, label: dict.nav.listings },
                { href: `/${locale}/agents`, label: dict.nav.agents },
              ]}
            />
            <LocaleSwitcher current={locale} label={dict.nav.language} />
            <NavAuth
              locale={locale}
              labels={{
                signIn: dict.nav.signIn,
                signOut: dict.nav.signOut,
                agentDashboard: dict.nav.agentDashboard,
                adminDashboard: dict.nav.adminDashboard,
              }}
            />
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
