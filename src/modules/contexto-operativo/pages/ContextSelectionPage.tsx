import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PlaceholderPage } from '../../../components/ui/PlaceholderPage';
import { getApiErrorMessage } from '../../../services/api/errors';
import { fetchOperationalContexts } from '../../../services/contexts/contexts-api';
import { useAuthStore } from '../../../store/auth-store';
import { useOperationalStore } from '../../../store/operational-store';

export function ContextSelectionPage() {
  const navigate = useNavigate();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const availableContexts = useOperationalStore((state) => state.availableContexts);
  const activeContext = useOperationalStore((state) => state.activeContext);
  const setAvailableContexts = useOperationalStore((state) => state.setAvailableContexts);
  const setActiveContext = useOperationalStore((state) => state.setActiveContext);

  const contextsQuery = useQuery({
    queryKey: ['contextos-operativos'],
    queryFn: fetchOperationalContexts,
    retry: false,
  });

  useEffect(() => {
    if (contextsQuery.data) {
      setAvailableContexts(contextsQuery.data);
    }
  }, [contextsQuery.data, setAvailableContexts]);

  const canManageContexts = hasPermission('negocioevento.gestionar');
  const nextRoute = hasPermission('caja.abrir')
    ? '/caja/apertura'
    : hasPermission('caja.cerrar')
      ? '/caja/historial'
      : hasPermission('venta.registrar')
        ? '/ventas/nueva'
        : hasPermission('compra.registrar')
          ? '/compras/nueva'
          : hasPermission('egreso.registrar')
            ? '/egresos/nuevo'
            : hasPermission('stock.consultar')
              ? '/stock'
              : canManageContexts
                ? '/admin/contextos'
                : '/sin-permiso';

  return (
    <PlaceholderPage
      description="Pantalla conectada al contrato `GET /api/v1/contextos-operativos` para seleccionar el negocio o evento que define la operacion del usuario."
      documents={['04 - HU-NEG-001 y HU-SEG-002', '13 - Arquitectura funcional frontend', '18 - Endpoint API-CTX-001']}
      eyebrow="FE-PAN-002 Contexto operativo"
      nextStep="Siguiente fase: enlazar esta seleccion con apertura/caja activa y aplicar estados operativos del contexto."
      phaseCoverage="Cubre `HU-NEG-001` como base de seleccion de contexto y refuerza visibilidad por permisos para `HU-SEG-002`."
      quickLinks={[
        { label: 'Apertura', to: '/caja/apertura' },
        { label: 'Caja activa', to: '/caja/activa' },
      ]}
      title="Seleccion de negocio o evento"
    >
      {contextsQuery.isLoading ? <p className="text-sm text-slate-600">Cargando contextos operativos...</p> : null}

      {contextsQuery.isError ? (
        <div className="rounded-3xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
          {getApiErrorMessage(contextsQuery.error, 'No se pudieron cargar los contextos operativos.')}
        </div>
      ) : null}

      {!contextsQuery.isLoading && !contextsQuery.isError && availableContexts.length === 0 ? (
        <div className="space-y-4 rounded-3xl bg-amber-50 px-4 py-4 text-sm text-amber-700">
          <p>
            Tu usuario no tiene contextos operativos disponibles todavia.
            {canManageContexts
              ? ' Registra un contexto para habilitar el flujo operativo.'
              : ' Solicita al equipo administrador que habilite al menos un contexto para continuar.'}
          </p>
          {canManageContexts ? (
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

      <div className="grid gap-4 md:grid-cols-2">
        {availableContexts.map((context) => {
          const isActive = context.id === activeContext?.id;
          return (
            <button
              key={context.id}
              className={`rounded-3xl border p-5 text-left transition ${
                isActive ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-200'
              }`}
              onClick={() => {
                setActiveContext(context);
                navigate(nextRoute);
              }}
              type="button"
            >
              <p className="text-lg font-semibold text-slate-900">{context.name}</p>
              <p className="mt-2 text-sm text-slate-500">Tipo: {context.kind}</p>
              <p className="mt-2 text-sm text-slate-500">Estado: {context.status}</p>
              <p className="mt-4 text-sm text-slate-600">
                {isActive ? 'Contexto activo para las rutas operativas.' : 'Selecciona este contexto para operar.'}
              </p>
            </button>
          );
        })}
      </div>
    </PlaceholderPage>
  );
}
