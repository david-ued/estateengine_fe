import { notFound } from 'next/navigation';
import { AgentShell, type AgentNavItem } from '@/components/agent/agent-shell';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { requireRole } from '@/lib/auth';
import { agentName, getSite } from '@/lib/site';

/** 房仲專用介面：左側 side nav 後台，僅 agent 可進入（單一 agent 品牌站，見 PIVOT.md） */
export default async function AgentLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [{ profile }, dict, site] = await Promise.all([
    requireRole(locale, ['agent']),
    getDictionary(locale),
    getSite(),
  ]);

  const brand = agentName(site, dict.common.appName);

  const navItems: AgentNavItem[] = [
    { key: 'listings', href: `/${locale}/agent`, label: dict.agent.myListings },
    {
      key: 'new',
      href: `/${locale}/agent/properties/new`,
      label: dict.agent.newListing,
    },
    {
      key: 'shareLinks',
      href: `/${locale}/agent/share-links`,
      label: dict.agent.shareLinksNav,
    },
    { key: 'inbox', href: `/${locale}/agent/inbox`, label: dict.agent.inboxNav },
    { key: 'brand', href: `/${locale}/agent/brand`, label: dict.agent.brandNav },
    { key: 'users', href: `/${locale}/agent/users`, label: dict.agent.usersNav },
  ];

  return (
    <AgentShell
      locale={locale}
      brand={brand}
      userName={profile.display_name ?? profile.full_name ?? ''}
      dashboardLabel={dict.agent.dashboardTitle}
      viewSiteLabel={dict.agent.viewSite}
      signOutLabel={dict.nav.signOut}
      menuLabel={dict.nav.menu}
      closeLabel={dict.nav.closeMenu}
      navItems={navItems}
    >
      {children}
    </AgentShell>
  );
}
