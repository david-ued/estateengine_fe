import type { Metadata } from 'next';
import { Geist_Mono, Jost, Playfair_Display } from 'next/font/google';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NavAuth } from '@/components/auth/nav-auth';
import { FavoritesProvider } from '@/components/favorites/favorites-provider';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { MobileNav } from '@/components/mobile-nav';
import { NavLinks } from '@/components/nav-links';
import { isLocale, locales } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { agentName, getSite } from '@/lib/site';
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

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, site] = await Promise.all([getDictionary(locale), getSite()]);

  // 品牌只呈現 agent 本人名字，不註明所屬仲介公司（PIVOT.md 2026-07-16 第二輪）
  const brand = agentName(site, dict.common.appName);

  // 桌機與手機導覽共用同一份連結與登入標籤
  const navLinks = [
    { href: `/${locale}/search`, label: dict.nav.search },
    { href: `/${locale}/about`, label: dict.nav.about },
    { href: `/${locale}/contact`, label: dict.nav.contact },
  ];
  const authLabels = {
    signIn: dict.nav.signIn,
    signOut: dict.nav.signOut,
    agentDashboard: dict.nav.agentDashboard,
    favorites: dict.nav.favorites,
  };

  return (
    <html
      lang={locale}
      className={`${playfair.variable} ${jost.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <FavoritesProvider>
          <nav className="sticky top-0 z-50 border-b border-white/10 bg-ink/95 text-white backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
              <Link
                href={`/${locale}`}
                className="shrink-0 transition-opacity hover:opacity-75"
              >
                <span className="font-display text-lg tracking-wide">
                  {brand}
                </span>
              </Link>
              {/* 桌機（md+）：完整橫向導覽 */}
              <div className="hidden min-w-0 items-center gap-3 text-sm md:flex md:gap-6">
                <NavLinks
                  links={navLinks}
                  activeClass="text-gold-soft font-semibold uppercase tracking-[0.14em] text-xs"
                  inactiveClass="text-white/75 transition-colors hover:text-gold-soft uppercase tracking-[0.14em] text-xs"
                />
                <LocaleSwitcher current={locale} label={dict.nav.language} />
                <NavAuth locale={locale} labels={authLabels} />
              </div>

              {/* 手機（<md）：漢堡選單 */}
              <MobileNav
                locale={locale}
                links={navLinks}
                localeLabel={dict.nav.language}
                authLabels={authLabels}
                menuLabel={dict.nav.menu}
                closeLabel={dict.nav.closeMenu}
              />
            </div>
          </nav>
          {children}
          <footer className="mt-auto border-t border-white/10 bg-ink text-white">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-8 md:grid-cols-3">
              <div>
                <p className="font-display text-xl tracking-wide">{brand}</p>
                <div className="gold-rule my-4" />
                <p className="max-w-xs text-sm leading-relaxed text-white/60">
                  {dict.footer.tagline}
                </p>
              </div>
              <div>
                <p className="eyebrow">{dict.footer.explore}</p>
                <ul className="mt-4 space-y-2.5 text-sm text-white/75">
                  <li>
                    <Link
                      href={`/${locale}/search`}
                      className="transition-colors hover:text-gold-soft"
                    >
                      {dict.nav.search}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/about`}
                      className="transition-colors hover:text-gold-soft"
                    >
                      {dict.nav.about}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/contact`}
                      className="transition-colors hover:text-gold-soft"
                    >
                      {dict.nav.contact}
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="eyebrow">{dict.footer.contactTitle}</p>
                <ul className="mt-4 space-y-2.5 text-sm text-white/75">
                  {site.agent?.phone && <li>{site.agent.phone}</li>}
                  {site.agent?.email && (
                    <li>
                      <a
                        href={`mailto:${site.agent.email}`}
                        className="transition-colors hover:text-gold-soft"
                      >
                        {site.agent.email}
                      </a>
                    </li>
                  )}
                  {site.agent?.contact_line_id && (
                    <li>LINE：{site.agent.contact_line_id}</li>
                  )}
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-white/10 px-4 py-5 text-xs text-white/40">
              <span>
                © {new Date().getFullYear()} {brand}. {dict.footer.rights}.
              </span>
              <Link
                href={`/${locale}/terms`}
                className="transition-colors hover:text-gold-soft"
              >
                {dict.footer.terms}
              </Link>
              <Link
                href={`/${locale}/privacy`}
                className="transition-colors hover:text-gold-soft"
              >
                {dict.footer.privacy}
              </Link>
            </div>
          </footer>
        </FavoritesProvider>
      </body>
    </html>
  );
}
