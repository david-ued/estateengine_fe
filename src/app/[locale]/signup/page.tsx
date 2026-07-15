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
      <div className="text-center">
        <h1 className="font-display text-3xl">{dict.auth.signupTitle}</h1>
        <p className="mt-3 text-sm text-neutral-500">{dict.auth.signupSubtitle}</p>
      </div>
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
