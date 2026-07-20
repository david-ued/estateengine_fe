/** 每次導航重新掛載 → 公開頁內容轉場動畫（頁首/頁尾在 layout，不隨之重播）。 */
export default function SiteTemplate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="page-in flex flex-1 flex-col">{children}</div>;
}
