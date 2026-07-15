export default function LoadingSearch() {
  return (
    <main className="flex flex-1 flex-col">
      {/* 篩選列骨架 */}
      <div className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center gap-2 px-4 py-3 sm:px-8">
          <div className="skeleton h-10 w-32" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton hidden h-10 w-28 md:block" />
          ))}
          <div className="skeleton ml-auto h-10 w-32" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-8">
        {/* 工具列骨架：view 切換 + 結果數 + 排序 */}
        <div className="mb-5 flex flex-wrap items-center gap-4">
          <div className="skeleton h-9 w-44" />
          <div className="skeleton h-4 w-20" />
          <div className="skeleton ml-auto h-9 w-40" />
        </div>

        {/* 卡片格骨架（xl 三欄，同 List view） */}
        <div className="grid grid-cols-1 gap-x-5 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="border border-neutral-200 dark:border-neutral-800"
            >
              <div className="skeleton aspect-[4/3] rounded-none" />
              <div className="flex flex-col gap-2 p-4">
                <div className="skeleton h-6 w-1/3" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
