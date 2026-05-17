import { Outlet } from 'react-router-dom';
import { AppLogo } from '../components/ui/AppLogo';

export function AuthLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-auth-gradient px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.18),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(13,148,136,0.15),_transparent_30%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6 text-white">
          <AppLogo />
          <div className="max-w-xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-100">Fase 1 Frontend</p>
            <h1 className="text-4xl font-semibold leading-tight lg:text-5xl">
              Base tecnica lista para construir el flujo operativo del sistema.
            </h1>
            <p className="text-sm leading-7 text-slate-200 lg:text-base">
              Este layout concentra acceso, feedback claro y un primer punto de entrada alineado con autenticacion,
              permisos y contexto operativo.
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/20 bg-white/92 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.25)] backdrop-blur lg:p-8">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
