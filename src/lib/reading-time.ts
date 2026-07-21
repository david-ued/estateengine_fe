/**
 * 粗估閱讀時間（分鐘）。
 * 中日文按字數（~350 字/分），拉丁文按詞數（~200 詞/分），兩者相加後四捨五入，最少 1 分鐘。
 */
export function readingTimeMinutes(html: string | null | undefined): number {
  if (!html) return 1;
  const text = html
    .replace(/<[^>]+>/g, ' ') // 去 HTML 標籤
    .replace(/&[a-z]+;/gi, ' ') // 去 HTML entity
    .replace(/\s+/g, ' ')
    .trim();

  const cjkRange = /[぀-ヿ㐀-鿿豈-﫿＀-￯]/g;
  const cjkChars = (text.match(cjkRange) ?? []).length;
  const words = (text.replace(cjkRange, ' ').match(/[A-Za-z0-9]+/g) ?? [])
    .length;

  const minutes = cjkChars / 350 + words / 200;
  return Math.max(1, Math.round(minutes));
}
