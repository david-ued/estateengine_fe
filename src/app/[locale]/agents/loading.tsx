export default function LoadingAgents() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-8">
      <div className="mb-2">
        <div className="skeleton h-8 w-40" />
      </div>
      <div className="skeleton mb-8 h-4 w-72 max-w-full" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800"
          >
            <div className="flex items-center gap-3">
              <div className="skeleton size-14 rounded-full" />
              <div className="flex-1">
                <div className="skeleton mb-2 h-5 w-2/3" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            </div>
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        ))}
      </div>
    </main>
  );
}
