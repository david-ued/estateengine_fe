export default function LoadingPropertyDetail() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-8">
      {/* anchor tabs 列 */}
      <div className="flex items-center justify-between gap-4 border-b border-neutral-200 py-4 dark:border-neutral-800">
        <div className="skeleton h-4 w-72 max-w-full" />
        <div className="skeleton h-4 w-32" />
      </div>

      {/* 標頭 */}
      <div className="space-y-3 py-8 sm:py-10">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-11 w-64 max-w-full" />
        <div className="skeleton h-8 w-2/3" />
        <div className="skeleton h-4 w-1/3" />
      </div>

      {/* gallery：16:9 主圖 + 縮圖列 */}
      <div className="skeleton aspect-video w-full" />
      <div className="mt-2 flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="skeleton aspect-[4/3] w-24 shrink-0 sm:w-28" />
        ))}
      </div>

      {/* 統計列 */}
      <div className="mt-8 grid grid-cols-2 gap-px sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton h-24" />
        ))}
      </div>

      {/* 內容 + 側欄 */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
        <div className="space-y-8">
          <div className="skeleton h-7 w-48" />
          <div className="skeleton h-40" />
          <div className="skeleton h-7 w-48" />
          <div className="skeleton h-64" />
        </div>
        <div className="skeleton h-72" />
      </div>
    </main>
  );
}
