type AuthGateFallbackProps = {
  message?: string;
};

export function AuthGateFallback({ message = 'Validando sesion...' }: AuthGateFallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Sistema Caja</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">Cargando acceso</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
      </div>
    </div>
  );
}
