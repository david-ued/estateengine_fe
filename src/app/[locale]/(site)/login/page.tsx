import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { getUserProfile, homePathForRole } from '@/lib/auth';

export default async function LoginPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // 已登入者直接送往角色對應的介面
  const session = await getUserProfile();
  if (session) redirect(homePathForRole(locale, session.profile.role));

  const dict = await getDictionary(locale);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="font-display text-3xl">{dict.auth.loginTitle}</h1>
        <p className="mt-3 text-sm text-neutral-500">{dict.auth.loginSubtitle}</p>
      </div>
      <LoginForm locale={locale} labels={dict.auth} />
      <p className="text-center text-sm text-neutral-500">
        {dict.auth.noAccount}{' '}
        <Link href={`/${locale}/signup`} className="font-medium underline">
          {dict.auth.signUp}
        </Link>
      </p>
    </main>
  );
}
