/** About 頁 loading 骨架：深色頁首帶 + 兩欄主體 + 物件卡片列 */
export default function LoadingAbout() {
  return (
    <main className="flex-1">
      {/* 深色帶上改用白色脈動塊（.skeleton 的黑底漸層在 ink 上不可見） */}
      <section className="bg-ink py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
          <div className="h-3 w-32 animate-pulse bg-white/10" />
          <div className="mt-4 h-12 w-72 max-w-full animate-pulse bg-white/10" />
          <div className="mt-4 h-3 w-48 animate-pulse bg-white/10" />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-16">
        <div className="skeleton aspect-[4/5] w-full rounded-none" />
        <div className="flex flex-col gap-4">
          <div className="skeleton h-4 w-56" />
          <div className="skeleton h-4 w-64" />
          <div className="skeleton mt-4 h-4 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-8">
        <div className="skeleton h-8 w-52" />
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="border border-neutral-200 dark:border-neutral-800"
            >
              <div className="skeleton aspect-[4/3] rounded-none" />
              <div className="flex flex-col gap-2 p-4">
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
