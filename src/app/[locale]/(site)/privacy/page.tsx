import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { agentName, getSite } from '@/lib/site';

// 簡易隱私權政策（法務長文不進字典，依語系取內容）
const COPY: Record<Locale, { intro: string; sections: { title: string; body: string }[] }> = {
  'zh-TW': {
    intro: '本政策說明本網站如何蒐集、使用與保護你的個人資料。',
    sections: [
      {
        title: '蒐集的資料',
        body: '註冊帳號時：電子郵件與姓名。使用服務時：收藏的物件、儲存的搜尋條件。送出聯絡表單時：姓名、電子郵件、電話（選填）與訊息內容。另為改善服務，會記錄匿名的物件瀏覽次數與停留時間，不與個人身分連結。',
      },
      {
        title: '使用目的',
        body: '資料僅用於：提供收藏與儲存搜尋功能、回覆你的詢問、了解物件受關注程度以改善服務。不會將你的資料出售或提供給第三方作行銷用途。',
      },
      {
        title: 'Cookie',
        body: '本網站僅使用維持登入狀態所必要的 cookie（Supabase 驗證憑證），不使用第三方廣告或追蹤 cookie。',
      },
      {
        title: '資料儲存與安全',
        body: '資料儲存於 Supabase（雲端資料庫服務），以加密連線傳輸，並以資料列層級權限（RLS）限制存取——你的收藏與儲存搜尋僅你本人可見。',
      },
      {
        title: '你的權利',
        body: '你可隨時在帳號中刪除收藏與儲存的搜尋。如需查詢、更正或刪除帳號與相關資料，請透過聯絡頁與我聯繫，我會在合理期間內處理。',
      },
      {
        title: '政策更新',
        body: '本政策可能不定期更新，更新後即於本頁公告生效。',
      },
    ],
  },
  en: {
    intro:
      'This policy explains how this website collects, uses, and protects your personal data.',
    sections: [
      {
        title: 'Data We Collect',
        body: 'When you register: email and name. When you use the service: saved favorites and saved searches. When you submit the contact form: name, email, phone (optional), and your message. To improve the service we also record anonymous listing view counts and dwell time, which are not linked to your identity.',
      },
      {
        title: 'How We Use It',
        body: 'Data is used only to provide favorites and saved searches, respond to your inquiries, and understand listing interest to improve the service. Your data is never sold or shared with third parties for marketing.',
      },
      {
        title: 'Cookies',
        body: 'Only cookies strictly necessary for keeping you signed in are used (Supabase auth credentials). No third-party advertising or tracking cookies.',
      },
      {
        title: 'Storage & Security',
        body: 'Data is stored with Supabase (a cloud database service), transmitted over encrypted connections, and protected with row-level security — your favorites and saved searches are visible only to you.',
      },
      {
        title: 'Your Rights',
        body: 'You can delete favorites and saved searches from your account at any time. To access, correct, or delete your account and related data, contact me via the contact page and I will respond within a reasonable time.',
      },
      {
        title: 'Updates',
        body: 'This policy may be updated from time to time and takes effect when posted on this page.',
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
  return { title: dict.footer.privacy };
}

export default async function PrivacyPage({
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
            {dict.footer.privacy}
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
