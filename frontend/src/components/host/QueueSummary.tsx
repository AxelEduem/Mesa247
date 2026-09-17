type QueueSummaryProps = {
  total: number;
  waiting: number;
  called: number;
};

export function QueueSummary({ total, waiting, called }: QueueSummaryProps) {
  return (
    <aside className="grid gap-4 rounded-[1.5rem] border border-line bg-surface-2 p-5">
      <h2 className="text-sm font-medium text-muted">Resumen</h2>
      <SummaryRow label="En cola" value={String(total)} />
      <SummaryRow label="En espera" value={String(waiting)} />
      <SummaryRow label="Llamados" value={String(called)} />
    </aside>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-xl font-semibold tabular-nums text-ink">{value}</span>
    </div>
  );
}
