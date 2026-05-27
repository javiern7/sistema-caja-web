import { useQuery } from '@tanstack/react-query';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ResourcePageShell } from '../../../components/ui/ResourcePageShell';
import { ResourceState } from '../../../components/ui/ResourceState';
import { ResourceTable } from '../../../components/ui/ResourceTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { getApiErrorMessage } from '../../../services/api/errors';
import { DEFAULT_PAGE_SIZE } from '../../../services/api/pagination';
import type { StockCurrentDto, StockMovementDto } from '../../../services/api/types';
import { fetchCurrentStockPage, fetchStockMovements, fetchStockMovementsPage } from '../../../services/stock/stock-api';
import { formatDateTime } from '../../../utils/format';
import { useMemo, useState } from 'react';

type StockSummaryByProduct = {
  purchased: number;
  sold: number;
  adjustments: number;
};

export function StockPage() {
  const [stockPage, setStockPage] = useState(0);
  const [stockPageSize, setStockPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [movementsPage, setMovementsPage] = useState(0);
  const [movementsPageSize, setMovementsPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [movementsSort, setMovementsSort] = useState('occurredAt,desc');

  const stockQuery = useQuery({
    queryKey: ['stock', 'current', stockPage, stockPageSize],
    queryFn: () => fetchCurrentStockPage({ page: stockPage, size: stockPageSize }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const movementsQuery = useQuery({
    queryKey: ['stock', 'movements', movementsPage, movementsPageSize, movementsSort],
    queryFn: () =>
      fetchStockMovementsPage({ page: movementsPage, size: movementsPageSize, sort: movementsSort }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const allMovementsQuery = useQuery({
    queryKey: ['stock', 'movements', 'all'],
    queryFn: fetchStockMovements,
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
      const current = summary.get(productId) ?? { purchased: 0, sold: 0, adjustments: 0 };
      const quantity = Number(movement.quantity || 0);
      const movementType = String(movement.movementType ?? '').toUpperCase();
      const referenceType = String(movement.referenceType ?? '').toUpperCase();

      if (movementType === 'ENTRADA' || referenceType === 'COMPRA') {
        current.purchased += quantity;
      } else if (movementType === 'SALIDA' || referenceType === 'VENTA') {
        current.sold += quantity;
      } else {
        current.adjustments += quantity;
      }

      summary.set(productId, current);
    });

    return summary;
  }, [allMovements]);
  const totalSold = Array.from(stockSummaryByProduct.values()).reduce((sum, item) => sum + item.sold, 0);
  const totalPurchased = Array.from(stockSummaryByProduct.values()).reduce((sum, item) => sum + item.purchased, 0);

  return (
    <ResourcePageShell
      badge="FE-STK-001 Stock real"
      description="Vista conectada a `GET /api/v1/stock` y `GET /api/v1/stock/movimientos` para validar existencias y trazabilidad real del inventario."
      documents={['04 - HU-STK-001', '18 - API-STK-001/API-STK-002', '26 - Frontend Fase operativa']}
      summary={
        <div className="grid gap-4 md:grid-cols-5">
          <MetricCard helper="Productos recibidos por el backend." label="Items de stock" value={String(stockQuery.data?.totalElements ?? stock.length)} />
          <MetricCard helper="Productos controlados con alerta simple." label="Bajo minimo" value={String(lowStockCount)} />
          <MetricCard helper="Cantidad total registrada como entrada por compras u otros ingresos." label="Ingresado" value={String(totalPurchased.toFixed(2))} />
          <MetricCard helper="Cantidad total registrada como salida por ventas." label="Vendido" value={String(totalSold.toFixed(2))} />
          <MetricCard helper="Util para detectar catalogo fuera de operacion." label="Productos inactivos" value={String(inactiveCount)} />
        </div>
      }
      title="Stock y movimientos"
    >
      {stockQuery.isLoading || movementsQuery.isLoading ? (
        <ResourceState body="Consultando stock actual y movimientos desde el backend..." title="Cargando stock" />
      ) : null}

      {stockQuery.isError ? (
        <ResourceState
          body={getApiErrorMessage(stockQuery.error, 'No se pudo consultar el stock actual.')}
          title="Error al consultar stock"
          tone="danger"
        />
      ) : null}

      {allMovementsQuery.isError ? (
        <ResourceState
          body={getApiErrorMessage(allMovementsQuery.error, 'No se pudieron consolidar los movimientos para el resumen de stock.')}
          title="Error al consolidar trazabilidad"
          tone="warning"
        />
      ) : null}

      {movementsQuery.isError ? (
        <ResourceState
          body={getApiErrorMessage(movementsQuery.error, 'No se pudieron consultar los movimientos de stock.')}
          title="Error al consultar movimientos"
          tone="danger"
        />
      ) : null}

      {!stockQuery.isLoading && !stockQuery.isError ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Stock actual</h2>
            <p className="text-sm text-slate-600">Existencias visibles para supervision operativa, incluyendo cuanto ingreso, cuanto salio por ventas, si el producto esta agotado y cuanto falta para volver al stock minimo.</p>
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

      {!movementsQuery.isLoading && !movementsQuery.isError ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Movimientos de stock</h2>
            <p className="text-sm text-slate-600">Trazabilidad operativa generada por compras, ventas y ajustes.</p>
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
