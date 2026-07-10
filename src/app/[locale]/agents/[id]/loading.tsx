export default function LoadingAgentProfile() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-8">
      <div className="skeleton mb-6 h-4 w-28" />
      <div className="mb-8 flex items-center gap-5">
        <div className="skeleton size-20 rounded-full" />
        <div className="flex-1">
          <div className="skeleton mb-2 h-7 w-52 max-w-full" />
          <div className="skeleton h-4 w-72 max-w-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <div className="skeleton aspect-[4/3] rounded-2xl" />
            <div className="skeleton mt-3 h-5 w-3/4" />
            <div className="skeleton mt-2 h-4 w-1/2" />
          </div>
        ))}
      </div>
    </main>
  );
}
