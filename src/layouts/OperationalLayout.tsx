import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { NavLink, Outlet } from 'react-router-dom';
import { AppLogo } from '../components/ui/AppLogo';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ApiError } from '../services/api/httpClient';
import { logoutRequest } from '../services/auth/auth-api';
import { fetchActiveCashBox } from '../services/cash/cash-api';
import { useAuthStore } from '../store/auth-store';
import { normalizeCashBox, useOperationalStore } from '../store/operational-store';
import { formatCurrency } from '../utils/format';

export function OperationalLayout() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canReadCash = hasPermission('caja.abrir') || hasPermission('caja.cerrar');
  const canAccessReports =
    hasPermission('auditoria.consultar') ||
    hasPermission('reporte.ver') ||
    hasPermission('reporte.exportar') ||
    hasPermission('reporte.ventas') ||
    hasPermission('reporte.caja') ||
    hasPermission('reporte.compras') ||
    hasPermission('reporte.egresos') ||
    hasPermission('reporte.stock') ||
    hasPermission('reporte.utilidad');
  const clearOperationalState = useOperationalStore((state) => state.clearOperationalState);
  const activeContext = useOperationalStore((state) => state.activeContext);
  const activeCash = useOperationalStore((state) => state.activeCash);
  const setActiveCash = useOperationalStore((state) => state.setActiveCash);
  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      clearSession();
      clearOperationalState();
    },
  });
  const activeCashQuery = useQuery({
    queryKey: ['cash-box', 'active', activeContext?.id],
    queryFn: fetchActiveCashBox,
    enabled: Boolean(activeContext) && canReadCash,
    retry: false,
  });

  useEffect(() => {
    if (!activeContext) {
      setActiveCash(null);
      return;
    }

    if (activeCashQuery.isSuccess) {
      const normalizedCash = normalizeCashBox(activeCashQuery.data);
      setActiveCash(normalizedCash.operationalContextId === activeContext.id ? normalizedCash : null);
      return;
    }

    if (activeCashQuery.isError) {
      if (activeCashQuery.error instanceof ApiError && activeCashQuery.error.status === 404) {
        setActiveCash(null);
      }
    }
  }, [activeCashQuery.data, activeCashQuery.error, activeCashQuery.isError, activeCashQuery.isSuccess, activeContext, setActiveCash]);

  const navItems = [
    { to: '/contexto', label: 'Contexto', visible: true },
    { to: '/caja/apertura', label: 'Apertura', visible: hasPermission('caja.abrir') },
    { to: '/caja/activa', label: 'Caja activa', visible: canReadCash },
    { to: '/caja/historial', label: 'Historial cajas', visible: canReadCash && Boolean(activeContext) },
    { to: '/ventas/nueva', label: 'Venta rapida', visible: hasPermission('venta.registrar') },
    { to: '/egresos/nuevo', label: 'Egresos', visible: hasPermission('egreso.registrar') },
    { to: '/compras/nueva', label: 'Compras', visible: hasPermission('compra.registrar') },
    { to: '/stock', label: 'Stock', visible: hasPermission('stock.consultar') },
    { to: '/reportes', label: 'Reportes', visible: canAccessReports },
  ].filter((item) => item.visible);

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-4 lg:flex-row lg:px-6">
        <aside className="w-full rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-soft backdrop-blur lg:w-80">
          <div className="space-y-6">
            <AppLogo />

            <div className="rounded-3xl bg-slate-950 px-4 py-5 text-white">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Sesion activa</p>
              <p className="mt-3 text-lg font-semibold">{user?.displayName ?? 'Sin sesion'}</p>
              <p className="text-sm text-slate-300">{user?.role ?? 'Rol no definido'}</p>
            </div>

            <div className="space-y-3 rounded-3xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Contexto</p>
                <StatusBadge
                  label={activeContext ? 'Listo' : 'Pendiente'}
                  tone={activeContext ? 'success' : 'warning'}
                />
              </div>
              <p className="text-sm text-slate-600">
                {activeContext ? `${activeContext.name} (${activeContext.kind})` : 'Selecciona negocio o evento.'}
              </p>
            </div>

            <div className="space-y-3 rounded-3xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Caja</p>
                <StatusBadge
                  label={
                    !canReadCash
                      ? 'Sin permiso'
                      : activeCashQuery.isLoading
                        ? 'Validando'
                        : activeCash?.status === 'ABIERTA'
                          ? 'Abierta'
                          : 'Sin apertura'
                  }
                  tone={!canReadCash ? 'neutral' : activeCash?.status === 'ABIERTA' ? 'success' : 'warning'}
                />
              </div>
              <p className="text-sm text-slate-600">
                {!canReadCash
                  ? 'Tu sesion no tiene acceso a los endpoints de caja activa del backend.'
                  : activeCash?.status === 'ABIERTA'
                  ? `Monto de apertura registrado: ${formatCurrency(activeCash.openingAmount)}`
                  : 'La operacion guiara primero a apertura de caja.'}
              </p>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  className={({ isActive }) =>
                    `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive ? 'bg-brand-500 text-white shadow-soft' : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <button
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
              type="button"
            >
              {logoutMutation.isPending ? 'Cerrando sesion...' : 'Cerrar sesion'}
            </button>
          </div>
        </aside>

        <main className="flex-1 rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-soft backdrop-blur lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
