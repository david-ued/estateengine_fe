import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { agentName, getSite } from '@/lib/site';

// 簡易服務條款（法務長文不進字典，依語系取內容）
const COPY: Record<Locale, { intro: string; sections: { title: string; body: string }[] }> = {
  'zh-TW': {
    intro:
      '歡迎使用本網站。繼續瀏覽或使用本網站，即表示你同意以下條款；若不同意，請停止使用。',
    sections: [
      {
        title: '網站性質',
        body: '本網站由持牌房地產經紀人營運，提供物件資訊、搜尋與聯絡功能。所有物件資料僅供參考，實際狀況（含價格、面積、屋況與可售狀態）以正式合約與產權文件為準，本網站不保證資訊即時、完整或無誤。',
      },
      {
        title: '非專業建議',
        body: '網站內容（含獨家數據標籤、學區、風水座向、建商評價、房貸試算等）僅為一般性參考，不構成法律、財務、稅務或投資建議。重大決定前請諮詢合格專業人士。',
      },
      {
        title: '帳號與使用',
        body: '你可註冊帳號以收藏物件與儲存搜尋條件。你應妥善保管帳號密碼，並對帳號下的活動負責。禁止以爬蟲大量抓取、干擾服務運作或任何違法用途。',
      },
      {
        title: '智慧財產',
        body: '本網站的文字、照片、設計與程式碼受著作權保護，未經書面同意不得轉載或作商業使用。',
      },
      {
        title: '責任限制',
        body: '在法律允許的最大範圍內，本網站對因使用或無法使用本服務所生的間接或衍生損失不負賠償責任。',
      },
      {
        title: '條款變更',
        body: '本條款可能不定期更新，更新後即於本頁公告生效。若有疑問，歡迎透過聯絡頁與我聯繫。',
      },
    ],
  },
  en: {
    intro:
      'Welcome. By continuing to browse or use this website you agree to the following terms; if you do not agree, please discontinue use.',
    sections: [
      {
        title: 'Nature of This Site',
        body: 'This website is operated by a licensed real estate agent and provides listing information, search, and contact features. All listing data is for reference only; actual conditions (including price, size, property condition and availability) are governed by formal contracts and title documents. No warranty is made that information is current, complete, or error-free.',
      },
      {
        title: 'No Professional Advice',
        body: 'Content on this site (including exclusive insight tags, school districts, feng shui orientation, builder ratings, and the mortgage calculator) is general reference only and does not constitute legal, financial, tax, or investment advice. Consult qualified professionals before making significant decisions.',
      },
      {
        title: 'Accounts & Acceptable Use',
        body: 'You may create an account to save favorites and searches. You are responsible for safeguarding your credentials and for activity under your account. Scraping, disrupting the service, or any unlawful use is prohibited.',
      },
      {
        title: 'Intellectual Property',
        body: 'The text, photography, design, and code of this website are protected by copyright and may not be reproduced or used commercially without written consent.',
      },
      {
        title: 'Limitation of Liability',
        body: 'To the maximum extent permitted by law, this website is not liable for indirect or consequential losses arising from use of, or inability to use, this service.',
      },
      {
        title: 'Changes to These Terms',
        body: 'These terms may be updated from time to time and take effect when posted on this page. Questions are welcome via the contact page.',
      },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.footer.terms };
}

export default async function TermsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, site] = await Promise.all([getDictionary(locale), getSite()]);
  const copy = COPY[locale];
  const brand = agentName(site, dict.common.appName);

  return (
    <main className="flex-1">
      <section className="bg-ink py-14 text-white">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-8">
          <p className="eyebrow">{brand}</p>
          <h1 className="font-display mt-3 text-4xl tracking-wide">
            {dict.footer.terms}
          </h1>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-8">
        <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
          {copy.intro}
        </p>
        <div className="mt-10 flex flex-col gap-8">
          {copy.sections.map((section, index) => (
            <section key={section.title}>
              <h2 className="font-display text-xl">
                {index + 1}. {section.title}
              </h2>
              <div className="gold-rule my-3" />
              <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
