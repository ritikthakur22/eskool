type InfoCardProps = {
  title: string;
  rows: [label: string, value: React.ReactNode][];
};

export function InfoCard({ title, rows }: InfoCardProps) {
  return (
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="border-b pb-3 text-lg font-semibold">{title}</h2>
      <dl className="mt-4 space-y-4">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium">{value || "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}