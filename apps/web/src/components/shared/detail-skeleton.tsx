export function DetailSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-6">
      <div className="h-36 animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}