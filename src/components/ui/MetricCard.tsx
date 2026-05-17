type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
};

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      {helper ? <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p> : null}
    </article>
  );
}
