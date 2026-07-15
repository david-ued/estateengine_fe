import { notFound } from 'next/navigation';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { NavLinks } from '@/components/nav-links';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { requireRole } from '@/lib/auth';

/** 房仲專用介面：僅 agent 可進入（單一 agent 品牌站，見 PIVOT.md） */
export default async function AgentLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { profile } = await requireRole(locale, ['agent']);
  const dict = await getDictionary(locale);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-4 sm:px-8 dark:border-neutral-800">
        <div className="flex items-center gap-6">
          <h1 className="font-semibold">{dict.agent.dashboardTitle}</h1>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <NavLinks
              links={[
                { href: `/${locale}/agent`, label: dict.agent.myListings },
                {
                  href: `/${locale}/agent/share-links`,
                  label: dict.agent.shareLinksNav,
                },
                {
                  href: `/${locale}/agent/inbox`,
                  label: dict.agent.inboxNav,
                },
                {
                  href: `/${locale}/agent/brand`,
                  label: dict.agent.brandNav,
                },
              ]}
            />
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-neutral-500">
            {profile.display_name ?? profile.full_name}
          </span>
          <SignOutButton locale={locale} label={dict.nav.signOut} />
        </div>
      </header>
      {children}
    </div>
  );
}
