import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { requireRole } from '@/lib/auth';

/** 房仲專用介面：僅 agent（與 super_admin）可進入 */
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
          <nav className="flex items-center gap-4 text-sm">
            <Link href={`/${locale}/agent`} className="hover:underline">
              {dict.agent.myListings}
            </Link>
            <Link href={`/${locale}/agent/share-links`} className="hover:underline">
              {dict.agent.shareLinksNav}
            </Link>
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
