export default function LoadingShareLinks() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-8">
      <div className="skeleton mb-6 h-7 w-44" />
      <div className="mb-8 rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
        <div className="skeleton mb-4 h-5 w-36" />
        <div className="skeleton mb-3 h-10 w-full" />
        <div className="skeleton mb-3 h-10 w-full" />
        <div className="skeleton h-10 w-40" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex gap-4 border-b border-neutral-200 p-4 last:border-b-0 dark:border-neutral-800"
          >
            <div className="skeleton h-9 flex-1" />
            <div className="skeleton h-9 w-24" />
          </div>
        ))}
      </div>
    </main>
  );
}
