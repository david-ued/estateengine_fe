/** 每次導航重新掛載 → 後台內容區轉場動畫（側欄在 layout，不隨之重播）。 */
export default function AgentTemplate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="page-in flex flex-1 flex-col">{children}</div>;
}
