import type { Metadata } from 'next';
import { Geist_Mono, Jost, Playfair_Display } from 'next/font/google';
import { notFound } from 'next/navigation';
import { FavoritesProvider } from '@/components/favorites/favorites-provider';
import { isLocale, locales } from '@/i18n/config';
import '../globals.css';

// 黑白金奢華風（PIVOT.md）：襯線大標 + 幾何無襯線內文
const playfair = Playfair_Display({
  variable: '--font-heading',
  subsets: ['latin'],
});

const jost = Jost({
  variable: '--font-body',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Tim Lin',
    template: '%s | Tim Lin',
  },
  description:
    'Tim Lin — Greater Vancouver real estate. Curated listings and exclusive local insights.',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * 語系根 layout：僅提供 html/body/字體/全域 provider。
 * 行銷版頁首/頁尾在 (site) group、後台 side nav 在 agent layout，各自負責 chrome。
 */
export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html
      lang={locale}
      className={`${playfair.variable} ${jost.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <FavoritesProvider>{children}</FavoritesProvider>
      </body>
    </html>
  );
}
