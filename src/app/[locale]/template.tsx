/** 每次導航重新掛載 → 全站頁面轉場動畫 */
export default function Template({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="page-in flex flex-1 flex-col">{children}</div>;
}
