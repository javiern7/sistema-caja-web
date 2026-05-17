export function AppLogo() {
  return (
    <div className="inline-flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-sm font-bold text-white shadow-soft">
        SC
      </div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Sistema de Caja</p>
        <p className="text-xs text-slate-500">Base operativa del frontend</p>
      </div>
    </div>
  );
}
