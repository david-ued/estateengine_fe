export default function LoadingAgent() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="skeleton h-7 w-32" />
        <div className="skeleton h-9 w-28" />
      </div>
      <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex gap-4 border-b border-neutral-200 p-4 last:border-b-0 dark:border-neutral-800"
          >
            <div className="skeleton h-10 flex-1" />
            <div className="skeleton h-10 w-24" />
            <div className="skeleton h-10 w-16" />
          </div>
        ))}
      </div>
    </main>
  );
}
