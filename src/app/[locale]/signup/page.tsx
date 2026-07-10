import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { SignupForm } from '@/components/auth/signup-form';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { getUserProfile, homePathForRole } from '@/lib/auth';

export default async function SignupPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const session = await getUserProfile();
  if (session) redirect(homePathForRole(locale, session.profile.role));

  const dict = await getDictionary(locale);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-8">
      <h1 className="text-center text-2xl font-bold">{dict.auth.signUp}</h1>
      <SignupForm labels={dict.auth} />
      <p className="text-center text-sm text-neutral-500">
        {dict.auth.haveAccount}{' '}
        <Link href={`/${locale}/login`} className="font-medium underline">
          {dict.auth.signIn}
        </Link>
      </p>
    </main>
  );
}
