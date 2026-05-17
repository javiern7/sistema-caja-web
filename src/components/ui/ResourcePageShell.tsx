import type { ReactNode } from 'react';
import { StatusBadge } from './StatusBadge';

type ResourcePageShellProps = {
  badge: string;
  title: string;
  description: string;
  documents: string[];
  summary: ReactNode;
  children: ReactNode;
};

export function ResourcePageShell({
  badge,
  title,
  description,
  documents,
  summary,
  children,
}: ResourcePageShellProps) {
  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <StatusBadge label={badge} tone="neutral" />
          <h1 className="text-3xl font-semibold text-slate-950">{title}</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        </div>

        <aside className="w-full max-w-sm rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Trazabilidad</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {documents.map((document) => (
              <li key={document}>{document}</li>
            ))}
          </ul>
        </aside>
      </header>

      {summary}

      {children}
    </section>
  );
}
