/**
 * 共用 UI class 常數：全站按鈕 / 輸入框 / 卡片 / 表格唯一來源。
 * 規範：主要動作一律品牌藍（btn.primary）、按鈕圓角 rounded-lg（導覽列 pill 除外）、
 * 卡片 rounded-2xl。禁止在元件內重新手刻同類樣式。
 */

export const btn = {
  /** 主要動作：品牌藍（.btn-primary 於 globals.css 定義 bg/hover） */
  primary:
    'press btn-primary inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed',
  /** 次要動作：描邊中性色 */
  secondary:
    'press inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium transition-colors hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800',
  /** 表格列 / 卡片內的小型操作鈕（維持 36px 以上觸控目標） */
  quiet:
    'press inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium transition-colors hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800',
  /** 破壞性操作（下架 / 降級等） */
  danger:
    'press inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950',
};

/** 文字輸入框 / textarea 共用樣式（focus ring 由全域 :focus-visible 提供） */
export const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-transparent px-4 py-2.5 text-sm transition-colors focus:border-brand dark:border-neutral-700';

/** select 共用樣式 */
export const selectClass =
  'rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm transition-colors focus:border-brand dark:border-neutral-700 dark:bg-neutral-950';

/** 卡片外殼（區塊、面板、表單 section） */
export const cardClass =
  'rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950';

/** 表格外框 + 內部樣式（agent / admin 列表共用） */
export const tableWrapClass =
  'overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800';
export const tableClass = 'w-full min-w-[640px] text-sm';
export const theadClass =
  'bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900';
export const thClass = 'px-4 py-3 font-medium';
export const tdClass = 'px-4 py-3';
export const trClass =
  'border-t border-neutral-200 dark:border-neutral-800';

/** 徽章 / 標籤 pill */
export const badgeClass =
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium';

/** 表單錯誤 / 成功訊息 */
export const errorTextClass = 'text-sm text-red-600 dark:text-red-400';
export const successTextClass = 'text-sm text-green-600 dark:text-green-400';
