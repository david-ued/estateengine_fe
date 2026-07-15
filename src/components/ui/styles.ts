/**
 * 共用 UI class 常數：全站按鈕 / 輸入框 / 卡片 / 表格唯一來源。
 * 黑白金奢華風（PIVOT.md）：方角、細框線、全大寫寬字距按鈕；
 * 主要動作近黑底 hover 轉金（.btn-primary 於 globals.css 定義）。
 * 禁止在元件內重新手刻同類樣式。
 */

export const btn = {
  /** 主要動作：近黑底、hover 金 */
  primary:
    'press btn-primary inline-flex items-center justify-center gap-1.5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] disabled:cursor-not-allowed',
  /** 次要動作：細框線描邊 */
  secondary:
    'press inline-flex items-center justify-center gap-1.5 border border-neutral-300 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700',
  /** 深色區塊（hero / CTA band）上的反白描邊鈕 */
  onDark:
    'press btn-ondark inline-flex items-center justify-center gap-1.5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] disabled:cursor-not-allowed',
  /** 表格列 / 卡片內的小型操作鈕（維持 36px 以上觸控目標） */
  quiet:
    'press inline-flex min-h-9 items-center justify-center gap-1 border border-neutral-300 px-3 py-1.5 text-xs font-medium transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700',
  /** 破壞性操作（下架 / 刪除等） */
  danger:
    'press inline-flex min-h-9 items-center justify-center gap-1 border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950',
};

/** 文字輸入框 / textarea 共用樣式（focus ring 由全域 :focus-visible 提供） */
export const inputClass =
  'w-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm transition-colors focus:border-gold dark:border-neutral-700';

/** select 共用樣式 */
export const selectClass =
  'border border-neutral-300 bg-transparent px-3 py-2 text-sm transition-colors focus:border-gold dark:border-neutral-700 dark:bg-neutral-950';

/** 卡片外殼（區塊、面板、表單 section）：方角細框 */
export const cardClass =
  'border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950';

/** 表格外框 + 內部樣式（agent 後台列表共用） */
export const tableWrapClass =
  'overflow-x-auto border border-neutral-200 dark:border-neutral-800';
export const tableClass = 'w-full min-w-[640px] text-sm';
export const theadClass =
  'bg-neutral-50 text-left text-xs uppercase tracking-[0.12em] text-neutral-500 dark:bg-neutral-900';
export const thClass = 'px-4 py-3 font-medium';
export const tdClass = 'px-4 py-3';
export const trClass = 'border-t border-neutral-200 dark:border-neutral-800';

/** 徽章 / 標籤（方角小標） */
export const badgeClass =
  'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.08em]';

/** 表單錯誤 / 成功訊息 */
export const errorTextClass = 'text-sm text-red-600 dark:text-red-400';
export const successTextClass = 'text-sm text-green-700 dark:text-green-400';
