import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ResourcePageShell } from '../../../components/ui/ResourcePageShell';
import { ResourceState } from '../../../components/ui/ResourceState';
import { ResourceTable } from '../../../components/ui/ResourceTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { getApiErrorMessage } from '../../../services/api/errors';
import type { CashMovementDto } from '../../../services/api/types';
import { fetchCashBoxSummary } from '../../../services/cash/cash-api';
import { normalizeCashBox, useOperationalStore } from '../../../store/operational-store';
import { formatCurrency, formatDateTime } from '../../../utils/format';

export function ActiveCashSummaryPage() {
  const navigate = useNavigate();
  const activeCash = useOperationalStore((state) => state.activeCash);
  const setActiveCash = useOperationalStore((state) => state.setActiveCash);

  const summaryQuery = useQuery({
    queryKey: ['cash-box', 'summary', activeCash?.id],
    queryFn: async () => fetchCashBoxSummary(Number(activeCash?.id)),
    enabled: Boolean(activeCash?.id),
    retry: false,
  });

  const summary = useMemo(() => {
    return summaryQuery.data ? normalizeCashBox(summaryQuery.data) : activeCash;
  }, [activeCash, summaryQuery.data]);

  useEffect(() => {
    if (!summaryQuery.data || !summary) {
      return;
    }

    const currentSnapshot = JSON.stringify(activeCash);
    const nextSnapshot = JSON.stringify(summary);

    if (currentSnapshot !== nextSnapshot) {
      setActiveCash(summary);
    }
  }, [activeCash, setActiveCash, summary, summaryQuery.data]);

  if (!activeCash) {
    return (
      <ResourceState
        action={
          <button
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={() => navigate('/caja/apertura')}
            type="button"
          >
            Ir a apertura de caja
          </button>
        }
        body="Necesitas una caja abierta para consultar el resumen operativo. Si acabas de entrar o cambiar de contexto, primero registra la apertura."
        title="Caja abierta pendiente"
        tone="warning"
      />
    );
  }

  return (
    <ResourcePageShell
      badge="FE-CAJ-002 Resumen real"
      description="Resumen conectado a `GET /api/v1/cajas/{cashBoxId}/resumen` para mostrar monto esperado, ventas, egresos y movimientos reales."
      documents={['04 - HU-CAJ-002', '18 - API-CAJ-002', '26 - Frontend Fase operativa']}
      summary={
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard helper="Monto registrado al abrir la caja." label="Apertura" value={formatCurrency(summary?.openingAmount)} />
          <MetricCard helper="Ventas consolidadas por backend." label="Ventas" value={formatCurrency(summary?.totalSales)} />
          <MetricCard helper="Egresos registrados contra la caja." label="Egresos" value={formatCurrency(summary?.totalExpenses)} />
          <MetricCard helper="Monto esperado segun operaciones." label="Esperado" value={formatCurrency(summary?.expectedAmount)} />
        </div>
      }
      title="Caja activa"
    >
      {summaryQuery.isLoading ? <ResourceState body="Consultando resumen operativo de caja..." title="Cargando resumen" /> : null}

      {summaryQuery.isError ? (
        <ResourceState
          body={getApiErrorMessage(summaryQuery.error, 'No se pudo consultar el resumen de la caja activa.')}
          title="Error al consultar caja"
          tone="danger"
        />
      ) : null}

      {summary ? (
        <>
          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Estado operativo</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Caja de {summary.operationalContextName ?? `contexto ${summary.operationalContextId}`} abierta por{' '}
                    {summary.openedByUsername ?? 'usuario no identificado'}.
                  </p>
                </div>
                <StatusBadge label={summary.status} tone={summary.status === 'ABIERTA' ? 'success' : 'warning'} />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <MetricCard helper="Hora reportada por backend." label="Abierta el" value={formatDateTime(summary.openedAt)} />
                <MetricCard helper="Ultimo cierre informado." label="Cerrada el" value={formatDateTime(summary.closedAt)} />
                <MetricCard helper="Ingresos adicionales registrados." label="Ingresos extra" value={formatCurrency(summary.additionalIncome)} />
                <MetricCard helper="Diferencia disponible una vez cerrada." label="Diferencia" value={formatCurrency(summary.differenceAmount)} />
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-950">Observaciones</h2>
              <div className="mt-4 space-y-4 text-sm text-slate-600">
                <div>
                  <p className="font-medium text-slate-900">Apertura</p>
                  <p>{summary.openingObservation ?? 'Sin observacion registrada.'}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Cierre</p>
                  <p>{summary.closingObservation ?? 'La caja sigue abierta o todavia no hay observacion de cierre.'}</p>
                </div>
              </div>
            </article>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Movimientos de caja</h2>
                <p className="text-sm text-slate-600">Trazabilidad enviada por el backend en el resumen de caja.</p>
              </div>
              <button
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                onClick={() => navigate('/caja/cierre')}
                type="button"
              >
                Ir a cierre
              </button>
            </div>

            {summary.movements.length === 0 ? (
              <ResourceState
                body="La caja esta abierta, pero todavia no registra ventas, egresos ni otros movimientos operativos."
                title="Sin movimientos registrados"
                tone="warning"
              />
            ) : (
              <ResourceTable<CashMovementDto>
                columns={[
                  {
                    key: 'type',
                    header: 'Movimiento',
                    render: (movement) => (
                      <div>
                        <p className="font-medium text-slate-900">{movement.movementType}</p>
                        <p className="text-xs text-slate-500">{movement.referenceType ?? 'Sin referencia'}</p>
                      </div>
                    ),
                  },
                  { key: 'amount', header: 'Monto', render: (movement) => formatCurrency(movement.amount) },
                  {
                    key: 'reference',
                    header: 'Referencia',
                    render: (movement) => movement.referenceId ?? 'No disponible',
                  },
                  {
                    key: 'who',
                    header: 'Responsable',
                    render: (movement) => (
                      <div>
                        <p>{movement.performedBy ?? 'No disponible'}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(movement.occurredAt)}</p>
                      </div>
                    ),
                  },
                ]}
                rowKey={(movement) => String(movement.id)}
                rows={summary.movements}
              />
            )}
          </section>
        </>
      ) : null}
    </ResourcePageShell>
  );
}
