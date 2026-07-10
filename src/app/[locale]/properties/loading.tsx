export default function LoadingProperties() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-8">
      <div className="mb-6 flex items-baseline justify-between">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-4 w-20" />
      </div>
      <div className="skeleton mb-6 h-28 w-full" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="skeleton hidden h-96 lg:block" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
              <div className="skeleton aspect-[4/3] rounded-none" />
              <div className="flex flex-col gap-2 p-4">
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
