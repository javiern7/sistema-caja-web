import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { getApiErrorMessage } from '../../../services/api/errors';
import { fetchOperationalContexts } from '../../../services/contexts/contexts-api';
import { useAuthStore } from '../../../store/auth-store';
import { useOperationalStore } from '../../../store/operational-store';

function resolveSuggestedRoute(options: {
  hasPermission: (permission: string) => boolean;
  hasActiveContext: boolean;
  hasOpenCash: boolean;
  hasAvailableContexts: boolean;
}) {
  const { hasPermission, hasActiveContext, hasOpenCash, hasAvailableContexts } = options;
  const canOpenCash = hasPermission('caja.abrir');
  const canCloseCash = hasPermission('caja.cerrar');
  const canRegisterSales = hasPermission('venta.registrar');
  const canRegisterPurchases = hasPermission('compra.registrar');
  const canRegisterExpenses = hasPermission('egreso.registrar');
  const canManageProducts = hasPermission('producto.gestionar');
  const canManageProviders = hasPermission('proveedor.gestionar');
  const canManageUsers = hasPermission('usuario.gestionar');
  const canManageRoles = hasPermission('rol.gestionar');
  const canManageContexts = hasPermission('negocioevento.gestionar');
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
  const hasOperationalFlow =
    canOpenCash ||
    canCloseCash ||
    canRegisterSales ||
    canRegisterPurchases ||
    canRegisterExpenses;

  if (!hasAvailableContexts && canManageContexts) {
    return '/admin/contextos';
  }

  if (!hasActiveContext && hasOperationalFlow) {
    return '/contexto';
  }

  if (canManageProducts) {
    return '/admin/productos';
  }

  if (canManageProviders) {
    return '/admin/proveedores';
  }

  if (canManageUsers) {
    return '/admin/usuarios';
  }

  if (canManageRoles) {
    return '/admin/roles';
  }

  if (canOpenCash && !hasOpenCash) {
    return '/caja/apertura';
  }

  if (canRegisterSales && hasOpenCash) {
    return '/caja/activa';
  }

  if (canCloseCash) {
    return '/caja/historial';
  }

  if (canRegisterSales) {
    return '/ventas/nueva';
  }

  if (canRegisterPurchases) {
    return '/compras/nueva';
  }

  if (hasPermission('stock.consultar')) {
    return '/stock';
  }

  if (canRegisterExpenses) {
    return '/egresos/nuevo';
  }

  if (canAccessReports) {
    return '/reportes';
  }

  if (canManageContexts) {
    return '/admin/contextos';
  }

  return '/sin-permiso';
}

export function PostLoginLandingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const availableContexts = useOperationalStore((state) => state.availableContexts);
  const activeContext = useOperationalStore((state) => state.activeContext);
  const activeCash = useOperationalStore((state) => state.activeCash);
  const setAvailableContexts = useOperationalStore((state) => state.setAvailableContexts);
  const setActiveContext = useOperationalStore((state) => state.setActiveContext);

  const canAccessOperationalContexts =
    hasPermission('negocioevento.gestionar') ||
    hasPermission('caja.abrir') ||
    hasPermission('venta.registrar') ||
    hasPermission('compra.registrar') ||
    hasPermission('egreso.registrar');

  const contextsQuery = useQuery({
    queryKey: ['contextos-operativos'],
    queryFn: fetchOperationalContexts,
    enabled: Boolean(token) && canAccessOperationalContexts,
    retry: false,
  });

  useEffect(() => {
    if (contextsQuery.data) {
      setAvailableContexts(contextsQuery.data);
    }
  }, [contextsQuery.data, setAvailableContexts]);

  const suggestedRoute = resolveSuggestedRoute({
    hasPermission,
    hasActiveContext: Boolean(activeContext),
    hasOpenCash: activeCash?.status === 'ABIERTA',
    hasAvailableContexts: availableContexts.length > 0,
  });

  const permissionCount = user?.permissions.length ?? 0;
  const hasContexts = availableContexts.length > 0;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <StatusBadge label="Inicio de sesion validado" tone="success" />
        <h1 className="text-3xl font-semibold text-slate-950">Arranque del frontend</h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Esta pantalla evita saltos silenciosos despues del login y deja visible si faltan permisos, contexto
          operativo o una ruta clara para seguir trabajando.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Sesion</p>
          <p className="mt-3 text-lg font-semibold text-slate-900">{user?.displayName ?? 'Usuario autenticado'}</p>
          <p className="mt-1 text-sm text-slate-600">{user?.role ?? 'Rol no identificado'}</p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Permisos visibles</p>
          <p className="mt-3 text-lg font-semibold text-slate-900">{permissionCount}</p>
          <p className="mt-1 text-sm text-slate-600">
            {permissionCount > 0 ? 'La sesion ya trae permisos para enrutar.' : 'La sesion no trae permisos aun.'}
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Contexto activo</p>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            {canAccessOperationalContexts ? activeContext?.name ?? 'Sin contexto activo' : 'No aplica a esta sesion'}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {!canAccessOperationalContexts
              ? 'Los modulos visibles para tu sesion no requieren seleccionar contexto operativo.'
              : activeContext
                ? `${activeContext.kind} en estado ${activeContext.status}`
                : 'Aun no se ha seleccionado uno.'}
          </p>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Siguiente paso</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Ruta sugerida: {suggestedRoute}</h2>
          </div>

          <button
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={() => navigate(suggestedRoute)}
            type="button"
          >
            Continuar
          </button>
        </div>

        {canAccessOperationalContexts && contextsQuery.isLoading ? <p className="mt-4 text-sm text-slate-600">Cargando contextos operativos...</p> : null}

        {canAccessOperationalContexts && contextsQuery.isError ? (
          <div className="mt-4 rounded-3xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
            {getApiErrorMessage(contextsQuery.error, 'No se pudieron cargar los contextos operativos.')}
          </div>
        ) : null}

        {canAccessOperationalContexts && !contextsQuery.isLoading && !contextsQuery.isError && !hasContexts ? (
          <div className="mt-4 space-y-4 rounded-3xl bg-amber-50 px-4 py-4 text-sm text-amber-700">
            <p>
              La sesion esta activa, pero el backend no devolvio contextos operativos disponibles para este usuario.
              {hasPermission('negocioevento.gestionar')
                ? ' Crea un contexto para habilitar el flujo operativo.'
                : ' Solicita al equipo administrador que habilite al menos un contexto para continuar.'}
            </p>
            {hasPermission('negocioevento.gestionar') ? (
              <button
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                onClick={() => navigate('/admin/contextos')}
                type="button"
              >
                Ir a contextos
              </button>
            ) : null}
          </div>
        ) : null}

        {canAccessOperationalContexts && !contextsQuery.isLoading && hasContexts ? (
          <div className="mt-5 space-y-3">
            <p className="text-sm font-medium text-slate-700">Contextos detectados</p>
            <div className="grid gap-3 md:grid-cols-2">
              {availableContexts.map((context) => {
                const isActive = context.id === activeContext?.id;

                return (
                  <button
                    key={context.id}
                    className={`rounded-3xl border p-4 text-left transition ${
                      isActive ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-200'
                    }`}
                    onClick={() => setActiveContext(context)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-semibold text-slate-900">{context.name}</p>
                      <StatusBadge label={isActive ? 'Activo' : 'Disponible'} tone={isActive ? 'success' : 'neutral'} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {context.kind} - {context.status}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
