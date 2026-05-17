import { Outlet } from 'react-router-dom';

export function ReportsLayout() {
  return (
    <div className="min-h-screen bg-app-gradient px-4 py-4">
      <div className="mx-auto min-h-screen max-w-7xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft lg:p-8">
        <header className="mb-8 space-y-3 border-b border-slate-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-700">Reportes</p>
          <h1 className="text-3xl font-semibold text-slate-900">Centro de consulta y exportacion</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Layout reservado para filtros, tablas y exportaciones una vez que el backend publique los contratos
            oficiales del modulo de reportes.
          </p>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
