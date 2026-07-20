import { notFound } from 'next/navigation';

/** catch-all：locale 底下未匹配的路徑一律進入在地化 not-found（而非 Next 預設 404） */
export default function CatchAll() {
  notFound();
}
