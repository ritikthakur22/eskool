export function SubjectChips({ subjects, limit }: { subjects: string[]; limit?: number }) {
  if (subjects.length === 0) return <span className="text-muted-foreground">—</span>;

  const shown = limit ? subjects.slice(0, limit) : subjects;
  const rest = subjects.length - shown.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((s) => (
        <span key={s} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {s}
        </span>
      ))}
      {rest > 0 && (
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">+{rest}</span>
      )}
    </div>
  );
}