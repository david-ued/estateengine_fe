import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContactForm } from '@/components/contact/contact-form';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { getSite } from '@/lib/site';

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.contact.title };
}

/** 聯絡頁：表單（寫入 contact_messages）+ 直接聯絡資訊（PIVOT.md） */
export default async function ContactPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // 物件內頁「詢問物件」入口：?property=<uuid>&title=<標題>
  const sp = await searchParams;
  const propertyId =
    typeof sp.property === 'string' && sp.property ? sp.property : undefined;
  const propertyTitle =
    typeof sp.title === 'string' && sp.title ? sp.title : undefined;

  const [dict, site] = await Promise.all([getDictionary(locale), getSite()]);

  const agent = site.agent;
  const hasDirectContact = Boolean(
    agent?.phone || agent?.email || agent?.contact_line_id,
  );

  return (
    <main className="flex-1">
      {/* 頁首深色帶 */}
      <section className="bg-ink py-16 text-white">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
          <h1 className="font-display text-4xl tracking-wide sm:text-5xl">
            {dict.contact.title}
          </h1>
          <div className="gold-rule mt-5" />
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/70">
            {dict.contact.subtitle}
          </p>
        </div>
      </section>

      {/* 兩欄：表單 + 直接聯絡 */}
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-16">
        <ContactForm
          locale={locale}
          labels={dict.contact}
          propertyId={propertyId}
          propertyTitle={propertyTitle}
        />

        {hasDirectContact && (
          <aside className="h-fit border border-neutral-200 p-6 dark:border-neutral-800 sm:p-8">
            <h2 className="eyebrow">{dict.contact.infoTitle}</h2>
            <div className="gold-rule mt-4" />
            <ul className="mt-6 space-y-5 text-sm">
              {agent?.phone && (
                <li>
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
                    {dict.contact.infoPhone}
                  </p>
                  <a
                    href={`tel:${agent.phone}`}
                    className="mt-1 inline-block transition-colors hover:text-gold"
                  >
                    {agent.phone}
                  </a>
                </li>
              )}
              {agent?.email && (
                <li>
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
                    {dict.contact.infoEmail}
                  </p>
                  <a
                    href={`mailto:${agent.email}`}
                    className="mt-1 inline-block transition-colors hover:text-gold"
                  >
                    {agent.email}
                  </a>
                </li>
              )}
              {agent?.contact_line_id && (
                <li>
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
                    {dict.contact.infoLine}
                  </p>
                  <p className="mt-1">{agent.contact_line_id}</p>
                </li>
              )}
            </ul>
          </aside>
        )}
      </section>
    </main>
  );
}
