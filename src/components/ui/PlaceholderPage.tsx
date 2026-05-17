import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type QuickLink = {
  label: string;
  to: string;
};

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  documents: string[];
  phaseCoverage: string;
  nextStep: string;
  quickLinks?: QuickLink[];
  children?: ReactNode;
};

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  documents,
  phaseCoverage,
  nextStep,
  quickLinks = [],
  children,
}: PlaceholderPageProps) {
  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-700">{eyebrow}</p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-slate-900">Base lista en esta pantalla</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Esta vista existe para fijar ruta, layout, guard y lugar del modulo dentro del frontend del MVP.
          </p>
          {children ? <div className="mt-5">{children}</div> : null}
        </article>

        <aside className="space-y-4">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Trazabilidad</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {documents.map((document) => (
                <li key={document}>{document}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Cobertura Fase 1</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{phaseCoverage}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{nextStep}</p>
          </article>

          {quickLinks.length > 0 ? (
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Rutas vecinas</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {quickLinks.map((link) => (
                  <Link
                    key={link.to}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
                    to={link.to}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </article>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
