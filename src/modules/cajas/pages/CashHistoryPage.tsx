import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ResourcePageShell } from '../../../components/ui/ResourcePageShell';
import { ResourceState } from '../../../components/ui/ResourceState';
import { ResourceTable } from '../../../components/ui/ResourceTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { getApiErrorMessage } from '../../../services/api/errors';
import { DEFAULT_PAGE_SIZE } from '../../../services/api/pagination';
import type { CashBoxDto, CashMovementDto } from '../../../services/api/types';
import { fetchCashBoxSummary, fetchCashBoxes } from '../../../services/cash/cash-api';
import { useOperationalStore } from '../../../store/operational-store';
import { formatCurrency, formatDateTime } from '../../../utils/format';

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500';

export function CashHistoryPage() {
  const navigate = useNavigate();
  const activeContext = useOperationalStore((state) => state.activeContext);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedCashId, setSelectedCashId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState('openedAt,desc');

  const cashBoxesQuery = useQuery({
    queryKey: ['cash-boxes', 'history', activeContext?.id, statusFilter, page, pageSize, sort],
    queryFn: () =>
      fetchCashBoxes({
        operationalContextId: activeContext ? Number(activeContext.id) : undefined,
        status: statusFilter || undefined,
        page,
        size: pageSize,
        sort,
      }),
    enabled: Boolean(activeContext),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const cashDetailQuery = useQuery({
    queryKey: ['cash-boxes', 'summary', selectedCashId],
    queryFn: () => fetchCashBoxSummary(Number(selectedCashId)),
    enabled: Boolean(selectedCashId),
    retry: false,
  });

  const cashBoxes = cashBoxesQuery.data?.items ?? [];
  const selectedCash = cashDetailQuery.data ?? null;
  const normalizedMovements: CashMovementDto[] = selectedCash?.movements ?? [];

  if (!activeContext) {
    return (
      <ResourceState
        action={
          <button
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={() => navigate('/contexto')}
            type="button"
          >
            Ir a seleccionar contexto
          </button>
        }
        body="Selecciona un contexto operativo antes de consultar historial de cajas."
        title="Contexto pendiente"
        tone="warning"
      />
    );
  }

  return (
    <ResourcePageShell
      badge="FE-CAJ-004 Historial"
      description="Consulta real sobre `GET /api/v1/cajas` filtrando por contexto operativo y estado para revisar aperturas y cierres ya registrados."
      documents={['04 - HU-CAJ-004', '18 - API-CAJ-004', '26 - Frontend Fase operativa']}
      summary={
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard helper="Contexto desde el que se consulta." label="Contexto" value={activeContext.name} />
          <MetricCard helper="Cajas visibles para el filtro actual." label="Registros" value={String(cashBoxesQuery.data?.totalElements ?? cashBoxes.length)} />
          <MetricCard helper="Aperturas aun no cerradas." label="Abiertas" value={String(cashBoxes.filter((cash) => cash.status === 'ABIERTA').length)} />
          <MetricCard helper="Cierres ya consolidados." label="Cerradas" value={String(cashBoxes.filter((cash) => cash.status === 'CERRADA').length)} />
        </div>
      }
      title="Historial de cajas"
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="grid gap-4 md:grid-cols-[1fr_3fr]">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Estado</span>
            <select
              className={inputClass}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(0);
              }}
              value={statusFilter}
            >
              <option value="">Todos</option>
              <option value="ABIERTA">ABIERTA</option>
              <option value="CERRADA">CERRADA</option>
            </select>
          </label>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            El backend acepta filtros por `status`, `operationalContextId` y `openedByUserId`. En esta fase se deja activo el filtro principal por contexto y estado.
          </div>
        </div>
      </section>

      {cashBoxesQuery.isLoading ? <ResourceState body="Consultando cajas registradas..." title="Cargando historial" /> : null}

      {cashBoxesQuery.isError ? (
        <ResourceState
          body={getApiErrorMessage(cashBoxesQuery.error, 'No se pudo consultar el historial de cajas.')}
          title="Error al consultar cajas"
          tone="danger"
        />
      ) : null}

      {!cashBoxesQuery.isLoading && !cashBoxesQuery.isError && cashBoxes.length === 0 ? (
        <ResourceState body="No hay cajas registradas para este contexto con el filtro actual." title="Historial sin registros" tone="warning" />
      ) : null}

      {!cashBoxesQuery.isLoading && !cashBoxesQuery.isError && cashBoxes.length > 0 ? (
        <>
          <ResourceTable<CashBoxDto>
            columns={[
              {
                key: 'id',
                header: 'Caja',
                render: (cash) => (
                  <button className="text-left" onClick={() => setSelectedCashId(String(cash.id))} type="button">
                    <p className="font-medium text-slate-900">Caja #{cash.id}</p>
                    <p className="text-xs text-slate-500">{cash.operationalContextName ?? activeContext.name}</p>
                  </button>
                ),
              },
              {
                key: 'status',
                header: 'Estado',
                render: (cash) => <StatusBadge label={cash.status} tone={cash.status === 'ABIERTA' ? 'success' : 'warning'} />,
              },
              { key: 'opening', header: 'Apertura', sortable: true, sortKey: 'openingAmount', render: (cash) => formatCurrency(cash.openingAmount) },
              { key: 'expected', header: 'Esperado', sortable: true, sortKey: 'expectedAmount', render: (cash) => formatCurrency(cash.expectedAmount) },
              { key: 'openedBy', header: 'Abierta por', render: (cash) => cash.openedByUsername ?? 'No disponible' },
              { key: 'openedAt', header: 'Fecha', sortable: true, sortKey: 'openedAt', render: (cash) => formatDateTime(cash.openedAt) },
            ]}
            emptyState={<p className="text-sm text-slate-500">No hay cajas registradas con el filtro actual.</p>}
            isLoading={cashBoxesQuery.isFetching}
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setPage(0);
            }}
            pagination={cashBoxesQuery.data}
            rowKey={(cash) => String(cash.id)}
            rows={cashBoxes}
            sort={{
              value: sort,
              onChange: (nextSort) => {
                setSort(nextSort);
                setPage(0);
              },
            }}
          />

          {selectedCashId ? (
            <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <h2 className="text-lg font-semibold text-slate-950">Detalle de caja #{selectedCash?.id ?? selectedCashId}</h2>
                {cashDetailQuery.isLoading ? <p className="mt-4 text-sm text-slate-600">Cargando detalle de caja...</p> : null}
                {cashDetailQuery.isError ? (
                  <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {getApiErrorMessage(cashDetailQuery.error, 'No se pudo cargar el detalle de la caja.')}
                  </div>
                ) : null}
                {selectedCash ? (
                  <>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <MetricCard helper="Ventas consolidadas en la caja." label="Ventas" value={formatCurrency(selectedCash.totalSales)} />
                      <MetricCard helper="Egresos descontados por backend." label="Egresos" value={formatCurrency(selectedCash.totalExpenses)} />
                      <MetricCard helper="Monto contado al cierre." label="Contado" value={formatCurrency(selectedCash.countedAmount)} />
                      <MetricCard helper="Diferencia final disponible." label="Diferencia" value={formatCurrency(selectedCash.differenceAmount)} />
                    </div>
                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                      <p><span className="font-medium text-slate-900">Observacion apertura:</span> {selectedCash.openingObservation ?? 'Sin observacion'}</p>
                      <p><span className="font-medium text-slate-900">Observacion cierre:</span> {selectedCash.closingObservation ?? 'Sin observacion'}</p>
                      <p><span className="font-medium text-slate-900">Cerrada por:</span> {selectedCash.closedByUsername ?? 'No disponible'}</p>
                    </div>
                  </>
                ) : null}
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <h2 className="text-lg font-semibold text-slate-950">Movimientos registrados</h2>
                {normalizedMovements.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-600">Esta caja no reporta movimientos en la respuesta del backend para el detalle seleccionado.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {normalizedMovements.map((movement) => (
                      <div key={String(movement.id)} className="rounded-2xl border border-slate-200 px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-medium text-slate-900">{movement.movementType}</p>
                          <p className="text-sm text-slate-600">{formatCurrency(movement.amount)}</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{movement.referenceType ?? 'Sin referencia'} {movement.referenceId ?? ''}</p>
                        <p className="mt-2 text-xs text-slate-500">{movement.performedBy ?? 'No disponible'} - {formatDateTime(movement.occurredAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </section>
          ) : null}
        </>
      ) : null}
    </ResourcePageShell>
  );
}
