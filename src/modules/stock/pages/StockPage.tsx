import { useQuery } from '@tanstack/react-query';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ResourcePageShell } from '../../../components/ui/ResourcePageShell';
import { ResourceState } from '../../../components/ui/ResourceState';
import { ResourceTable } from '../../../components/ui/ResourceTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { getApiErrorMessage } from '../../../services/api/errors';
import type { StockCurrentDto, StockMovementDto } from '../../../services/api/types';
import { fetchCurrentStock, fetchStockMovements } from '../../../services/stock/stock-api';
import { formatDateTime } from '../../../utils/format';

export function StockPage() {
  const stockQuery = useQuery({
    queryKey: ['stock', 'current'],
    queryFn: fetchCurrentStock,
    retry: false,
  });

  const movementsQuery = useQuery({
    queryKey: ['stock', 'movements'],
    queryFn: fetchStockMovements,
    retry: false,
  });

  const stock = stockQuery.data ?? [];
  const movements = movementsQuery.data ?? [];
  const lowStockCount = stock.filter((item) => item.stockControlled && Number(item.currentStock) <= Number(item.minimumStock)).length;
  const inactiveCount = stock.filter((item) => !item.productActive).length;

  return (
    <ResourcePageShell
      badge="FE-STK-001 Stock real"
      description="Vista conectada a `GET /api/v1/stock` y `GET /api/v1/stock/movimientos` para validar existencias y trazabilidad real del inventario."
      documents={['04 - HU-STK-001', '18 - API-STK-001/API-STK-002', '26 - Frontend Fase operativa']}
      summary={
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard helper="Productos recibidos por el backend." label="Items de stock" value={String(stock.length)} />
          <MetricCard helper="Productos controlados con alerta simple." label="Bajo minimo" value={String(lowStockCount)} />
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
            <p className="text-sm text-slate-600">Existencias visibles para supervision y validacion operativa.</p>
          </div>

          {stock.length === 0 ? (
            <ResourceState body="El backend no devolvio registros de stock en este momento." title="Stock vacio" tone="warning" />
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
            <ResourceState body="Todavia no hay movimientos de stock registrados en el backend." title="Sin movimientos" tone="warning" />
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
                  render: (movement) => (
                    <div>
                      <p>{movement.performedBy ?? 'No disponible'}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(movement.occurredAt)}</p>
                    </div>
                  ),
                },
              ]}
              rowKey={(movement) => String(movement.id)}
              rows={movements}
            />
          )}
        </section>
      ) : null}
    </ResourcePageShell>
  );
}
