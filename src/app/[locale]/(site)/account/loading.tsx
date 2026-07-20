export default function LoadingAccount() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-8 sm:py-14">
      <div className="skeleton h-9 w-48" />
      <div className="mt-12 skeleton h-4 w-28" />
      <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="border border-neutral-200 dark:border-neutral-800">
            <div className="skeleton aspect-[4/3]" />
            <div className="flex flex-col gap-2 p-4">
              <div className="skeleton h-6 w-28" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-16 skeleton h-4 w-28" />
      <div className="mt-6 flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="skeleton h-24" />
        ))}
      </div>
    </main>
  );
}
