export function CardSkeleton() {
  return (
    <div className="rounded-xl p-4 mb-3" style={{ backgroundColor: "#111" }}>
      <div className="skeleton h-4 w-1/3 mb-3" />
      <div className="skeleton h-3 w-2/3 mb-2" />
      <div className="skeleton h-3 w-1/2" />
    </div>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="px-5 space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="rounded-xl p-4 flex-1 min-w-0" style={{ backgroundColor: "#111" }}>
      <div className="skeleton h-8 w-16 mb-2" />
      <div className="skeleton h-3 w-20" />
    </div>
  );
}
