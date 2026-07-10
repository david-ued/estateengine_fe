import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MediaUploader } from '@/components/agent/media-uploader';
import { PropertyForm } from '@/components/agent/property-form';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Property } from '@/lib/types';

export default async function EditPropertyPage({
  params,
}: Readonly<{ params: Promise<{ locale: string; id: string }> }>) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const { user } = await requireRole(locale, ['agent']);
  const dict = await getDictionary(locale);

  // RLS + agent_id 過濾：只能編輯自己的物件
  const supabase = await createClient();
  const { data: property } = await supabase
    .from('properties')
    .select('*, media(*)')
    .eq('id', id)
    .eq('agent_id', user.id)
    .maybeSingle<Property>();

  if (!property) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-4 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/${locale}/agent`} className="text-sm text-neutral-500 hover:underline">
          ← {dict.common.back}
        </Link>
        <h2 className="text-xl font-bold">{dict.agentForm.editTitle}</h2>
      </div>
      <div className="flex flex-col gap-6">
        <MediaUploader
          propertyId={property.id}
          labels={dict.agentForm}
          existing={property.media ?? []}
        />
        <PropertyForm locale={locale} labels={dict.agentForm} property={property} />
      </div>
    </main>
  );
}
