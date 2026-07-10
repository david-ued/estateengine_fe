export default function LoadingAdminUsers() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="skeleton h-7 w-40" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="flex gap-4 border-b border-neutral-200 p-4 last:border-b-0 dark:border-neutral-800"
          >
            <div className="skeleton h-9 flex-1" />
            <div className="skeleton h-9 w-24" />
            <div className="skeleton h-9 w-28" />
          </div>
        ))}
      </div>
    </main>
  );
}
