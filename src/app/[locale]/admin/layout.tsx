import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { requireRole } from '@/lib/auth';

/** Admin 專屬後台：僅 super_admin 可進入 */
export default async function AdminLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { profile } = await requireRole(locale, ['super_admin']);
  const dict = await getDictionary(locale);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-neutral-950 px-4 py-4 text-white sm:px-8">
        <div className="flex items-center gap-6">
          <h1 className="font-semibold">🛡 {dict.admin.dashboardTitle}</h1>
          <nav className="flex items-center gap-4 text-sm text-neutral-300">
            <Link href={`/${locale}/admin`} className="hover:text-white hover:underline">
              {dict.admin.listingsNav}
            </Link>
            <Link href={`/${locale}/admin/users`} className="hover:text-white hover:underline">
              {dict.admin.usersNav}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-neutral-400">
            {profile.display_name ?? profile.full_name}
          </span>
          <SignOutButton locale={locale} label={dict.nav.signOut} />
        </div>
      </header>
      {children}
    </div>
  );
}
