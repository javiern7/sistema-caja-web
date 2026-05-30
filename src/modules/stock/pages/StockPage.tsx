import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ResourcePageShell } from '../../../components/ui/ResourcePageShell';
import { ResourceState } from '../../../components/ui/ResourceState';
import { ResourceTable } from '../../../components/ui/ResourceTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { getApiErrorMessage } from '../../../services/api/errors';
import { DEFAULT_PAGE_SIZE } from '../../../services/api/pagination';
import type { StockCurrentDto, StockMovementDto } from '../../../services/api/types';
import { fetchCurrentStockPage, fetchStockMovements, fetchStockMovementsPage } from '../../../services/stock/stock-api';
import { useOperationalStore } from '../../../store/operational-store';
import { formatDateTime } from '../../../utils/format';

type StockSummaryByProduct = {
  purchased: number;
  sold: number;
  reversedIn: number;
  reversedOut: number;
  adjustments: number;
};

export function StockPage() {
  const navigate = useNavigate();
  const activeContext = useOperationalStore((state) => state.activeContext);
  const activeContextId = activeContext ? Number(activeContext.id) : null;
  const [stockPage, setStockPage] = useState(0);
  const [stockPageSize, setStockPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [movementsPage, setMovementsPage] = useState(0);
  const [movementsPageSize, setMovementsPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [movementsSort, setMovementsSort] = useState('occurredAt,desc');

  useEffect(() => {
    setStockPage(0);
    setMovementsPage(0);
  }, [activeContextId]);

  const stockQuery = useQuery({
    queryKey: ['stock', 'current', activeContextId, stockPage, stockPageSize],
    queryFn: () => fetchCurrentStockPage({ operationalContextId: activeContextId as number, page: stockPage, size: stockPageSize }),
    enabled: Boolean(activeContextId),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const movementsQuery = useQuery({
    queryKey: ['stock', 'movements', activeContextId, movementsPage, movementsPageSize, movementsSort],
    queryFn: () =>
      fetchStockMovementsPage({
        operationalContextId: activeContextId as number,
        page: movementsPage,
        size: movementsPageSize,
        sort: movementsSort,
      }),
    enabled: Boolean(activeContextId),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const allMovementsQuery = useQuery({
    queryKey: ['stock', 'movements', 'all', activeContextId],
    queryFn: () => fetchStockMovements(activeContextId as number),
    enabled: Boolean(activeContextId),
    retry: false,
  });

  const stock = stockQuery.data?.items ?? [];
  const movements = movementsQuery.data?.items ?? [];
  const allMovements = allMovementsQuery.data ?? [];
  const lowStockCount = stock.filter((item) => item.stockControlled && Number(item.currentStock) <= Number(item.minimumStock)).length;
  const inactiveCount = stock.filter((item) => !item.productActive).length;
  const stockSummaryByProduct = useMemo(() => {
    const summary = new Map<number, StockSummaryByProduct>();

    allMovements.forEach((movement) => {
      const productId = Number(movement.productId);
      const current = summary.get(productId) ?? { purchased: 0, sold: 0, reversedIn: 0, reversedOut: 0, adjustments: 0 };
      const quantity = Number(movement.quantity || 0);
      const movementType = String(movement.movementType ?? '').toUpperCase();
      const referenceType = String(movement.referenceType ?? '').toUpperCase();

      if (movementType === 'ENTRADA' || referenceType === 'COMPRA') {
        current.purchased += quantity;
      } else if (movementType === 'SALIDA' || referenceType === 'VENTA') {
        current.sold += quantity;
      } else if (movementType === 'REVERSA' && referenceType === 'VENTA_ANULADA') {
        current.reversedIn += quantity;
      } else if (movementType === 'REVERSA' && referenceType === 'COMPRA_ANULADA') {
        current.reversedOut += quantity;
      } else {
        current.adjustments += quantity;
      }

      summary.set(productId, current);
    });

    return summary;
  }, [allMovements]);
  const totalSold = Array.from(stockSummaryByProduct.values()).reduce((sum, item) => sum + item.sold, 0);
  const totalPurchased = Array.from(stockSummaryByProduct.values()).reduce((sum, item) => sum + item.purchased, 0);
  const totalReversedIn = Array.from(stockSummaryByProduct.values()).reduce((sum, item) => sum + item.reversedIn, 0);
  const totalReversedOut = Array.from(stockSummaryByProduct.values()).reduce((sum, item) => sum + item.reversedOut, 0);

  return (
    <ResourcePageShell
      badge="FE-STK-001 Stock real"
      description="Vista conectada a `GET /api/v1/stock` y `GET /api/v1/stock/movimientos` para validar existencias y trazabilidad real del inventario aislado por contexto operativo."
      documents={['04 - HU-STK-001', '18 - API-STK-001/API-STK-002', '26 - Frontend Fase operativa']}
      summary={
        <div className="grid gap-4 md:grid-cols-7">
          <MetricCard helper="Contexto operativo activo aplicado a consultas y movimientos." label="Contexto" value={activeContext?.name ?? 'Sin contexto'} />
          <MetricCard helper="Productos recibidos por el backend." label="Items de stock" value={String(stockQuery.data?.totalElements ?? stock.length)} />
          <MetricCard helper="Productos controlados con alerta simple." label="Bajo minimo" value={String(lowStockCount)} />
          <MetricCard helper="Cantidad total registrada como entrada bruta por compras." label="Ingresado" value={String(totalPurchased.toFixed(2))} />
          <MetricCard helper="Cantidad total registrada como salida bruta por ventas." label="Vendido" value={String(totalSold.toFixed(2))} />
          <MetricCard
            helper="Reversas visibles por anulaciones. `+` repone stock por venta anulada y `-` descuenta stock por compra anulada."
            label="Reversas"
            value={`+${totalReversedIn.toFixed(2)} / -${totalReversedOut.toFixed(2)}`}
          />
          <MetricCard helper="Util para detectar catalogo fuera de operacion." label="Productos inactivos" value={String(inactiveCount)} />
        </div>
      }
      title="Stock y movimientos"
    >
      {!activeContext ? (
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
          body="Selecciona un contexto operativo para consultar stock, movimientos y reversas sin mezclar datos entre negocios o eventos."
          title="Contexto requerido para stock"
          tone="warning"
        />
      ) : null}

      {activeContext && (stockQuery.isLoading || movementsQuery.isLoading) ? (
        <ResourceState body="Consultando stock actual y movimientos desde el backend..." title="Cargando stock" />
      ) : null}

      {activeContext && stockQuery.isError ? (
        <ResourceState
          body={getApiErrorMessage(stockQuery.error, 'No se pudo consultar el stock actual.')}
          title="Error al consultar stock"
          tone="danger"
        />
      ) : null}

      {activeContext && allMovementsQuery.isError ? (
        <ResourceState
          body={getApiErrorMessage(allMovementsQuery.error, 'No se pudieron consolidar los movimientos para el resumen de stock.')}
          title="Error al consolidar trazabilidad"
          tone="warning"
        />
      ) : null}

      {activeContext && movementsQuery.isError ? (
        <ResourceState
          body={getApiErrorMessage(movementsQuery.error, 'No se pudieron consultar los movimientos de stock.')}
          title="Error al consultar movimientos"
          tone="danger"
        />
      ) : null}

      {activeContext && !stockQuery.isLoading && !stockQuery.isError ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Stock actual</h2>
            <p className="text-sm text-slate-600">Existencias visibles solo para el contexto activo, incluyendo compras, ventas, reversas por anulacion, si el producto esta agotado y cuanto falta para volver al stock minimo.</p>
          </div>

          {stock.length === 0 ? (
            <ResourceState
              body="Todavia no hay productos con stock visible para este criterio. Registra movimientos o revisa si el catalogo base ya fue cargado."
              title="Stock sin registros"
              tone="warning"
            />
          ) : (
            <ResourceTable<StockCurrentDto>
              columns={[
                {
                  key: 'product',
                  header: 'Producto',
                  render: (item) => (
                    <div>
                      <p className="font-medium text-slate-900">{item.productName}</p>
                      <p className="text-xs text-slate-500">{item.productCode}</p>
                    </div>
                  ),
                },
                { key: 'unit', header: 'Unidad', render: (item) => item.unitOfMeasure },
                {
                  key: 'current',
                  header: 'Stock actual',
                  render: (item) => (
                    <div>
                      <p>{Number(item.currentStock).toFixed(2)}</p>
                      <p className="text-xs text-slate-500">Minimo: {Number(item.minimumStock).toFixed(2)}</p>
                    </div>
                  ),
                },
                {
                  key: 'purchased',
                  header: 'Ingresado',
                  render: (item) => Number(stockSummaryByProduct.get(Number(item.productId))?.purchased ?? 0).toFixed(2),
                },
                {
                  key: 'sold',
                  header: 'Vendido',
                  render: (item) => Number(stockSummaryByProduct.get(Number(item.productId))?.sold ?? 0).toFixed(2),
                },
                {
                  key: 'reversals',
                  header: 'Reversas',
                  render: (item) => {
                    const summary = stockSummaryByProduct.get(Number(item.productId));
                    const reversedIn = Number(summary?.reversedIn ?? 0).toFixed(2);
                    const reversedOut = Number(summary?.reversedOut ?? 0).toFixed(2);
                    return (
                      <div>
                        <p>+{reversedIn}</p>
                        <p className="text-xs text-slate-500">-{reversedOut}</p>
                      </div>
                    );
                  },
                },
                {
                  key: 'missing',
                  header: 'Faltante al minimo',
                  render: (item) => {
                    const missing = Math.max(Number(item.minimumStock) - Number(item.currentStock), 0);
                    return (
                      <div>
                        <p>{missing.toFixed(2)}</p>
                        <p className="text-xs text-slate-500">{missing > 0 ? 'Para volver al minimo' : 'En o sobre minimo'}</p>
                      </div>
                    );
                  },
                },
                {
                  key: 'availability',
                  header: 'Disponibilidad',
                  render: (item) => (
                    <div className="space-y-2">
                      <StatusBadge
                        label={Number(item.currentStock) <= 0 ? 'Agotado' : 'Disponible'}
                        tone={Number(item.currentStock) <= 0 ? 'warning' : 'success'}
                      />
                      {Number(item.currentStock) > 0 && Number(item.currentStock) <= Number(item.minimumStock) ? (
                        <StatusBadge label="Stock corto" tone="warning" />
                      ) : null}
                    </div>
                  ),
                },
                {
                  key: 'control',
                  header: 'Control',
                  render: (item) => (
                    <div className="space-y-2">
                      <StatusBadge label={item.stockControlled ? 'Controlado' : 'Libre'} tone={item.stockControlled ? 'success' : 'neutral'} />
                      {item.stockControlled && Number(item.currentStock) <= Number(item.minimumStock) ? (
                        <StatusBadge label="Bajo minimo" tone="warning" />
                      ) : null}
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: 'Estado',
                  render: (item) => <StatusBadge label={item.productActive ? 'Activo' : 'Inactivo'} tone={item.productActive ? 'success' : 'warning'} />,
                },
                { key: 'updated', header: 'Actualizado', render: (item) => formatDateTime(item.updatedAt) },
              ]}
              emptyState={<p className="text-sm text-slate-500">No hay stock para mostrar con el criterio actual.</p>}
              isLoading={stockQuery.isFetching}
              onPageChange={setStockPage}
              onPageSizeChange={(nextSize) => {
                setStockPageSize(nextSize);
                setStockPage(0);
              }}
              pagination={stockQuery.data}
              rowKey={(item) => String(item.productId)}
              rows={stock}
            />
          )}
        </section>
      ) : null}

      {activeContext && !movementsQuery.isLoading && !movementsQuery.isError ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Movimientos de stock</h2>
            <p className="text-sm text-slate-600">Trazabilidad operativa del contexto activo, generada por compras, ventas, anulaciones y ajustes.</p>
          </div>

          {movements.length === 0 ? (
            <ResourceState
              body="Todavia no hay movimientos de stock para este criterio. Cuando existan compras, ventas o ajustes, apareceran en este bloque."
              title="Sin movimientos registrados"
              tone="warning"
            />
          ) : (
            <ResourceTable<StockMovementDto>
              columns={[
                {
                  key: 'product',
                  header: 'Producto',
                  render: (movement) => (
                    <div>
                      <p className="font-medium text-slate-900">{movement.productName}</p>
                      <p className="text-xs text-slate-500">{movement.productCode}</p>
                    </div>
                  ),
                },
                { key: 'type', header: 'Movimiento', render: (movement) => movement.movementType },
                { key: 'quantity', header: 'Cantidad', render: (movement) => Number(movement.quantity).toFixed(2) },
                {
                  key: 'reference',
                  header: 'Referencia',
                  render: (movement) => (
                    <div>
                      <p>{movement.referenceType ?? 'Sin referencia'}</p>
                      <p className="text-xs text-slate-500">{movement.referenceId ?? 'No disponible'}</p>
                    </div>
                  ),
                },
                {
                  key: 'audit',
                  header: 'Responsable',
                  sortable: true,
                  sortKey: 'occurredAt',
                  render: (movement) => (
                    <div>
                      <p>{movement.performedBy ?? 'No disponible'}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(movement.occurredAt)}</p>
                    </div>
                  ),
                },
              ]}
              emptyState={<p className="text-sm text-slate-500">No hay movimientos para mostrar con el criterio actual.</p>}
              isLoading={movementsQuery.isFetching}
              onPageChange={setMovementsPage}
              onPageSizeChange={(nextSize) => {
                setMovementsPageSize(nextSize);
                setMovementsPage(0);
              }}
              pagination={movementsQuery.data}
              rowKey={(movement) => String(movement.id)}
              rows={movements}
              sort={{
                value: movementsSort,
                onChange: (nextSort) => {
                  setMovementsSort(nextSort);
                  setMovementsPage(0);
                },
              }}
            />
          )}
        </section>
      ) : null}
    </ResourcePageShell>
  );
}
