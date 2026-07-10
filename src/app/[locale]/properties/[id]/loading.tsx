export default function LoadingPropertyDetail() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-8">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <div className="skeleton h-8 w-2/5" />
        <div className="skeleton h-7 w-32" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="skeleton col-span-2 row-span-2 aspect-square sm:aspect-[4/3]" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton aspect-[4/3]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="skeleton h-48" />
        <div className="skeleton h-48" />
      </div>
    </main>
  );
}
