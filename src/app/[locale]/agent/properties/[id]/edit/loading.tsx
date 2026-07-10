export default function LoadingEditProperty() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-8">
      <div className="skeleton mb-6 h-4 w-24" />
      <div className="skeleton mb-8 h-7 w-40" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="mb-6 rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800"
        >
          <div className="skeleton mb-4 h-5 w-32" />
          <div className="skeleton mb-3 h-10 w-full" />
          <div className="skeleton mb-3 h-10 w-full" />
          <div className="skeleton h-10 w-2/3" />
        </div>
      ))}
    </main>
  );
}
