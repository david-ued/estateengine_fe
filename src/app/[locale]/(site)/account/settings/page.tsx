import { notFound, redirect } from 'next/navigation';
import { AccountTabs } from '@/components/account/account-tabs';
import { ProfileSettingsForm } from '@/components/account/profile-settings-form';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { getUserProfile } from '@/lib/auth';

/** 買家帳號設定：個人資料 + 變更密碼（需登入；agent 亦可用）。 */
export default async function AccountSettingsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getUserProfile();
  if (!session) redirect(`/${locale}/login`);

  const dict = await getDictionary(locale);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-8 sm:py-14">
      <header>
        <h1 className="font-display text-3xl sm:text-4xl">
          {dict.account.settings.title}
        </h1>
        <div className="gold-rule mt-5" />
      </header>

      <AccountTabs
        locale={locale}
        labels={{
          saved: dict.account.navSaved,
          settings: dict.account.navSettings,
        }}
      />

      <ProfileSettingsForm
        userId={session.user.id}
        email={session.user.email ?? ''}
        initialDisplayName={
          session.profile.display_name ?? session.profile.full_name ?? ''
        }
        labels={dict.account.settings}
      />
    </main>
  );
}
