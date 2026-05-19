import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ResourcePageShell } from '../../../components/ui/ResourcePageShell';
import { ResourceState } from '../../../components/ui/ResourceState';
import { ResourceTable } from '../../../components/ui/ResourceTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { getApiErrorMessage } from '../../../services/api/errors';
import type {
  AuditOperationDto,
  CashReportRowDto,
  ExpenseReportRowDto,
  PurchaseReportRowDto,
  ReportHistoryDto,
  SalesReportRowDto,
  StockReportRowDto,
} from '../../../services/api/types';
import {
  fetchAuditOperations,
  fetchCashReport,
  fetchExpenseReport,
  fetchPurchaseReport,
  fetchReportHistory,
  fetchSalesReport,
  fetchStockReport,
  fetchSystemHealth,
  fetchUtilityReport,
} from '../../../services/reports/reports-api';
import { useAuthStore } from '../../../store/auth-store';
import { useOperationalStore } from '../../../store/operational-store';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/format';

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500';

type ReportPanelProps = {
  badge: string;
  title: string;
  tone: 'success' | 'warning' | 'neutral';
  description: string;
  children: ReactNode;
};

function ReportPanel({ badge, title, tone, description, children }: ReportPanelProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>
        <StatusBadge label={badge} tone={tone} />
      </div>
      {children}
    </section>
  );
}

export function ReportsHomePage() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const activeContext = useOperationalStore((state) => state.activeContext);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState('');
  const [generatedByFilter, setGeneratedByFilter] = useState('');

  const canViewAudit = hasPermission('auditoria.consultar');
  const canViewSales = hasPermission('reporte.ver') || hasPermission('reporte.ventas');
  const canViewCash = hasPermission('reporte.ver') || hasPermission('reporte.caja');
  const canViewPurchases = hasPermission('reporte.ver') || hasPermission('reporte.compras');
  const canViewExpenses = hasPermission('reporte.ver') || hasPermission('reporte.egresos');
  const canViewStock = hasPermission('reporte.ver') || hasPermission('reporte.stock') || hasPermission('stock.consultar');
  const canViewUtility = hasPermission('reporte.ver') || hasPermission('reporte.utilidad');
  const canViewHistory = hasPermission('reporte.ver') || hasPermission('reporte.exportar');

  const reportFilters = {
    fechaDesde: dateFrom || undefined,
    fechaHasta: dateTo || undefined,
    operationalContextId: activeContext ? Number(activeContext.id) : undefined,
  };

  const auditQuery = useQuery({
    queryKey: ['reports', 'audit', moduleFilter, usernameFilter],
    queryFn: () =>
      fetchAuditOperations({
        module: moduleFilter || undefined,
        username: usernameFilter || undefined,
      }),
    enabled: canViewAudit,
    retry: false,
  });

  const healthQuery = useQuery({
    queryKey: ['reports', 'system-health'],
    queryFn: fetchSystemHealth,
    retry: false,
  });

  const salesQuery = useQuery({
    queryKey: ['reports', 'sales', reportFilters],
    queryFn: () => fetchSalesReport(reportFilters),
    enabled: canViewSales,
    retry: false,
  });

  const cashQuery = useQuery({
    queryKey: ['reports', 'cash', reportFilters],
    queryFn: () => fetchCashReport(reportFilters),
    enabled: canViewCash,
    retry: false,
  });

  const purchasesQuery = useQuery({
    queryKey: ['reports', 'purchases', reportFilters],
    queryFn: () => fetchPurchaseReport(reportFilters),
    enabled: canViewPurchases,
    retry: false,
  });

  const expensesQuery = useQuery({
    queryKey: ['reports', 'expenses', reportFilters],
    queryFn: () => fetchExpenseReport(reportFilters),
    enabled: canViewExpenses,
    retry: false,
  });

  const stockQuery = useQuery({
    queryKey: ['reports', 'stock', reportFilters],
    queryFn: () => fetchStockReport(reportFilters),
    enabled: canViewStock,
    retry: false,
  });

  const utilityQuery = useQuery({
    queryKey: ['reports', 'utility', reportFilters],
    queryFn: () => fetchUtilityReport(reportFilters),
    enabled: canViewUtility,
    retry: false,
  });

  const historyQuery = useQuery({
    queryKey: ['reports', 'history', reportTypeFilter, generatedByFilter],
    queryFn: () =>
      fetchReportHistory({
        reportType: reportTypeFilter || undefined,
        generatedBy: generatedByFilter || undefined,
      }),
    enabled: canViewHistory,
    retry: false,
  });

  const operations = auditQuery.data ?? [];
  const historyRows = historyQuery.data ?? [];
  const availableReportBlocks = [
    canViewAudit,
    canViewSales,
    canViewCash,
    canViewPurchases,
    canViewExpenses,
    canViewStock,
    canViewUtility,
    canViewHistory,
  ].filter(Boolean).length;

  return (
    <ResourcePageShell
      badge="FE-REP-001 Centro real"
      description="Centro de validacion fina frontend-backend para auditoria, reportes operativos, utilidad, historial y estado tecnico del backend."
      documents={['13 - Arquitectura funcional frontend', '17 - Layouts y rutas', '18 - Endpoints de reportes y auditoria']}
      summary={
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard helper="Disponibilidad reportada por el backend." label="Backend" value={healthQuery.data?.status ?? 'Sin dato'} />
          <MetricCard helper="Bloques reales de consulta habilitados por permiso." label="Bloques activos" value={String(availableReportBlocks)} />
          <MetricCard helper="Eventos de auditoria visibles." label="Auditoria" value={String(operations.length)} />
          <MetricCard helper="Historial de reportes visible." label="Historial" value={String(historyRows.length)} />
        </div>
      }
      title="Auditoría y reportes"
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Fecha desde</span>
            <input className={inputClass} onChange={(event) => setDateFrom(event.target.value)} type="date" value={dateFrom} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Fecha hasta</span>
            <input className={inputClass} onChange={(event) => setDateTo(event.target.value)} type="date" value={dateTo} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Modulo auditado</span>
            <input className={inputClass} onChange={(event) => setModuleFilter(event.target.value)} placeholder="ventas, compras, auth..." value={moduleFilter} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Usuario auditado</span>
            <input className={inputClass} onChange={(event) => setUsernameFilter(event.target.value)} placeholder="admin, cajero..." value={usernameFilter} />
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Tipo de reporte en historial</span>
            <input className={inputClass} onChange={(event) => setReportTypeFilter(event.target.value)} placeholder="VENTAS, CAJA..." value={reportTypeFilter} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Generado por</span>
            <input className={inputClass} onChange={(event) => setGeneratedByFilter(event.target.value)} placeholder="admin..." value={generatedByFilter} />
          </label>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {activeContext
            ? `Los reportes operativos se consultan contra el contexto activo ${activeContext.name} (ID ${activeContext.id}) cuando el endpoint admite operationalContextId.`
            : 'Si no hay contexto activo, los reportes se consultan sin filtro de contexto.'}
        </div>
      </section>

      {canViewSales ? (
        <ReportPanel
          badge={salesQuery.isLoading ? 'Cargando' : salesQuery.isError ? 'Error' : 'Listo'}
          description="Contrato real `GET /api/v1/reportes/ventas`."
          title="Reporte de ventas"
          tone={salesQuery.isError ? 'warning' : salesQuery.isLoading ? 'neutral' : 'success'}
        >
          {salesQuery.isLoading ? <ResourceState body="Consultando reporte de ventas..." title="Cargando ventas" /> : null}
          {salesQuery.isError ? <ResourceState body={getApiErrorMessage(salesQuery.error, 'No se pudo consultar el reporte de ventas.')} title="Error en reporte de ventas" tone="danger" /> : null}
          {salesQuery.data ? (
            <>
              <div className="mb-5 grid gap-4 md:grid-cols-3">
                <MetricCard helper="Ventas efectivas devueltas por el backend." label="Total ventas" value={String(salesQuery.data.totalSales)} />
                <MetricCard helper="Monto consolidado del reporte." label="Monto" value={formatCurrency(salesQuery.data.totalAmount)} />
                <MetricCard helper="Filas detalladas incluidas." label="Items" value={String(salesQuery.data.items.length)} />
              </div>
              <ResourceTable<SalesReportRowDto>
                columns={[
                  {
                    key: 'receipt',
                    header: 'Comprobante',
                    render: (row) => (
                      <div>
                        <p className="font-medium text-slate-900">{row.internalReceipt ?? `Venta ${row.saleId}`}</p>
                        <p className="text-xs text-slate-500">{row.operationalContextName ?? 'Sin contexto'}</p>
                      </div>
                    ),
                  },
                  { key: 'seller', header: 'Usuario', render: (row) => row.soldByUsername ?? 'No disponible' },
                  { key: 'date', header: 'Fecha', render: (row) => formatDateTime(row.createdAt) },
                  { key: 'itemsCount', header: 'Items', render: (row) => String(row.itemsCount) },
                  { key: 'amount', header: 'Monto', render: (row) => formatCurrency(row.totalAmount) },
                ]}
                rowKey={(row) => String(row.saleId)}
                rows={salesQuery.data.items}
              />
            </>
          ) : null}
        </ReportPanel>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        {canViewCash ? (
          <ReportPanel
            badge={cashQuery.isLoading ? 'Cargando' : cashQuery.isError ? 'Error' : 'Listo'}
            description="Contrato real `GET /api/v1/reportes/caja`."
            title="Reporte de caja"
            tone={cashQuery.isError ? 'warning' : cashQuery.isLoading ? 'neutral' : 'success'}
          >
            {cashQuery.isLoading ? <ResourceState body="Consultando reporte de caja..." title="Cargando caja" /> : null}
            {cashQuery.isError ? <ResourceState body={getApiErrorMessage(cashQuery.error, 'No se pudo consultar el reporte de caja.')} title="Error en reporte de caja" tone="danger" /> : null}
            {cashQuery.data ? (
              <>
                <div className="mb-5 grid gap-4 md:grid-cols-2">
                  <MetricCard helper="Cajas devueltas por el backend." label="Cajas" value={String(cashQuery.data.totalCashBoxes)} />
                  <MetricCard helper="Diferencia total consolidada." label="Diferencia" value={formatCurrency(cashQuery.data.totalDifferenceAmount)} />
                </div>
                <ResourceTable<CashReportRowDto>
                  columns={[
                    {
                      key: 'cash',
                      header: 'Caja',
                      render: (row) => (
                        <div>
                          <p className="font-medium text-slate-900">Caja #{row.cashBoxId}</p>
                          <p className="text-xs text-slate-500">{row.operationalContextName ?? 'Sin contexto'}</p>
                        </div>
                      ),
                    },
                    { key: 'status', header: 'Estado', render: (row) => <StatusBadge label={row.status} tone={row.status === 'ABIERTA' ? 'success' : 'warning'} /> },
                    { key: 'openedBy', header: 'Apertura', render: (row) => row.openedByUsername ?? 'No disponible' },
                    { key: 'expected', header: 'Esperado', render: (row) => formatCurrency(row.expectedAmount) },
                    { key: 'difference', header: 'Diferencia', render: (row) => formatCurrency(row.differenceAmount) },
                  ]}
                  rowKey={(row) => String(row.cashBoxId)}
                  rows={cashQuery.data.items}
                />
              </>
            ) : null}
          </ReportPanel>
        ) : null}

        {canViewPurchases ? (
          <ReportPanel
            badge={purchasesQuery.isLoading ? 'Cargando' : purchasesQuery.isError ? 'Error' : 'Listo'}
            description="Contrato real `GET /api/v1/reportes/compras`."
            title="Reporte de compras"
            tone={purchasesQuery.isError ? 'warning' : purchasesQuery.isLoading ? 'neutral' : 'success'}
          >
            {purchasesQuery.isLoading ? <ResourceState body="Consultando reporte de compras..." title="Cargando compras" /> : null}
            {purchasesQuery.isError ? <ResourceState body={getApiErrorMessage(purchasesQuery.error, 'No se pudo consultar el reporte de compras.')} title="Error en reporte de compras" tone="danger" /> : null}
            {purchasesQuery.data ? (
              <>
                <div className="mb-5 grid gap-4 md:grid-cols-2">
                  <MetricCard helper="Compras incluidas en el reporte." label="Compras" value={String(purchasesQuery.data.totalPurchases)} />
                  <MetricCard helper="Monto efectivo consolidado." label="Monto" value={formatCurrency(purchasesQuery.data.totalAmount)} />
                </div>
                <ResourceTable<PurchaseReportRowDto>
                  columns={[
                    { key: 'provider', header: 'Proveedor', render: (row) => row.providerName ?? 'No disponible' },
                    { key: 'status', header: 'Estado', render: (row) => <StatusBadge label={row.status} tone={row.status === 'REGISTRADA' ? 'success' : 'warning'} /> },
                    { key: 'date', header: 'Fecha', render: (row) => formatDate(row.purchaseDate) },
                    { key: 'context', header: 'Contexto', render: (row) => row.operationalContextName ?? 'Sin contexto' },
                    { key: 'amount', header: 'Monto', render: (row) => formatCurrency(row.effectiveAmount) },
                  ]}
                  rowKey={(row) => String(row.purchaseId)}
                  rows={purchasesQuery.data.items}
                />
              </>
            ) : null}
          </ReportPanel>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {canViewExpenses ? (
          <ReportPanel
            badge={expensesQuery.isLoading ? 'Cargando' : expensesQuery.isError ? 'Error' : 'Listo'}
            description="Contrato real `GET /api/v1/reportes/egresos`."
            title="Reporte de egresos"
            tone={expensesQuery.isError ? 'warning' : expensesQuery.isLoading ? 'neutral' : 'success'}
          >
            {expensesQuery.isLoading ? <ResourceState body="Consultando reporte de egresos..." title="Cargando egresos" /> : null}
            {expensesQuery.isError ? <ResourceState body={getApiErrorMessage(expensesQuery.error, 'No se pudo consultar el reporte de egresos.')} title="Error en reporte de egresos" tone="danger" /> : null}
            {expensesQuery.data ? (
              <>
                <div className="mb-5 grid gap-4 md:grid-cols-2">
                  <MetricCard helper="Egresos devueltos por el backend." label="Egresos" value={String(expensesQuery.data.totalExpenses)} />
                  <MetricCard helper="Monto consolidado." label="Monto" value={formatCurrency(expensesQuery.data.totalAmount)} />
                </div>
                <ResourceTable<ExpenseReportRowDto>
                  columns={[
                    { key: 'type', header: 'Tipo', render: (row) => <StatusBadge label={row.expenseType} tone="neutral" /> },
                    { key: 'category', header: 'Categoria', render: (row) => row.category },
                    { key: 'description', header: 'Descripcion', render: (row) => row.description },
                    { key: 'date', header: 'Fecha', render: (row) => formatDate(row.expenseDate) },
                    { key: 'amount', header: 'Monto', render: (row) => formatCurrency(row.amount) },
                  ]}
                  rowKey={(row) => String(row.expenseId)}
                  rows={expensesQuery.data.items}
                />
              </>
            ) : null}
          </ReportPanel>
        ) : null}

        {canViewStock ? (
          <ReportPanel
            badge={stockQuery.isLoading ? 'Cargando' : stockQuery.isError ? 'Error' : 'Listo'}
            description="Contrato real `GET /api/v1/reportes/stock`."
            title="Reporte de stock"
            tone={stockQuery.isError ? 'warning' : stockQuery.isLoading ? 'neutral' : 'success'}
          >
            {stockQuery.isLoading ? <ResourceState body="Consultando reporte de stock..." title="Cargando stock" /> : null}
            {stockQuery.isError ? <ResourceState body={getApiErrorMessage(stockQuery.error, 'No se pudo consultar el reporte de stock.')} title="Error en reporte de stock" tone="danger" /> : null}
            {stockQuery.data ? (
              <>
                <div className="mb-5 grid gap-4 md:grid-cols-2">
                  <MetricCard helper="Productos visibles en el reporte." label="Productos" value={String(stockQuery.data.totalProducts)} />
                  <MetricCard helper="Unidades globales reportadas." label="Unidades" value={String(stockQuery.data.totalUnits)} />
                </div>
                <ResourceTable<StockReportRowDto>
                  columns={[
                    {
                      key: 'product',
                      header: 'Producto',
                      render: (row) => (
                        <div>
                          <p className="font-medium text-slate-900">{row.productName}</p>
                          <p className="text-xs text-slate-500">{row.productCode}</p>
                        </div>
                      ),
                    },
                    { key: 'unit', header: 'Unidad', render: (row) => row.unitOfMeasure },
                    { key: 'currentStock', header: 'Stock actual', render: (row) => String(row.currentStock) },
                    { key: 'minimumStock', header: 'Minimo', render: (row) => String(row.minimumStock) },
                    { key: 'status', header: 'Estado', render: (row) => <StatusBadge label={row.active ? 'Activo' : 'Inactivo'} tone={row.active ? 'success' : 'warning'} /> },
                  ]}
                  rowKey={(row) => String(row.productId)}
                  rows={stockQuery.data.items}
                />
              </>
            ) : null}
          </ReportPanel>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {canViewUtility ? (
          <ReportPanel
            badge={utilityQuery.isLoading ? 'Cargando' : utilityQuery.isError ? 'Error' : 'Listo'}
            description="Contrato real `GET /api/v1/reportes/utilidad`."
            title="Reporte de utilidad"
            tone={utilityQuery.isError ? 'warning' : utilityQuery.isLoading ? 'neutral' : 'success'}
          >
            {utilityQuery.isLoading ? <ResourceState body="Consultando reporte de utilidad..." title="Cargando utilidad" /> : null}
            {utilityQuery.isError ? <ResourceState body={getApiErrorMessage(utilityQuery.error, 'No se pudo consultar el reporte de utilidad.')} title="Error en reporte de utilidad" tone="danger" /> : null}
            {utilityQuery.data ? (
              <div className="grid gap-4 md:grid-cols-2">
                <MetricCard helper="Ventas del periodo." label="Ventas" value={formatCurrency(utilityQuery.data.salesAmount)} />
                <MetricCard helper="Compras del periodo." label="Compras" value={formatCurrency(utilityQuery.data.purchaseAmount)} />
                <MetricCard helper="Egresos del periodo." label="Egresos" value={formatCurrency(utilityQuery.data.expenseAmount)} />
                <MetricCard helper="Costo estimado de ventas." label="Costo estimado" value={formatCurrency(utilityQuery.data.estimatedCostOfSales)} />
                <MetricCard helper="Margen bruto calculado." label="Margen bruto" value={formatCurrency(utilityQuery.data.grossMargin)} />
                <MetricCard helper="Utilidad neta reportada." label="Utilidad neta" value={formatCurrency(utilityQuery.data.netUtility)} />
              </div>
            ) : null}
          </ReportPanel>
        ) : null}

        {canViewHistory ? (
          <ReportPanel
            badge={historyQuery.isLoading ? 'Cargando' : historyQuery.isError ? 'Error' : 'Listo'}
            description="Contrato real `GET /api/v1/reportes/historial`."
            title="Historial de reportes"
            tone={historyQuery.isError ? 'warning' : historyQuery.isLoading ? 'neutral' : 'success'}
          >
            {historyQuery.isLoading ? <ResourceState body="Consultando historial de reportes..." title="Cargando historial" /> : null}
            {historyQuery.isError ? <ResourceState body={getApiErrorMessage(historyQuery.error, 'No se pudo consultar el historial de reportes.')} title="Error en historial" tone="danger" /> : null}
            {historyQuery.data ? (
              <ResourceTable<ReportHistoryDto>
                columns={[
                  { key: 'reportType', header: 'Reporte', render: (row) => row.reportType },
                  { key: 'format', header: 'Formato', render: (row) => row.format },
                  { key: 'generatedBy', header: 'Generado por', render: (row) => row.generatedBy },
                  { key: 'generatedAt', header: 'Fecha', render: (row) => formatDateTime(row.generatedAt) },
                  { key: 'filters', header: 'Filtros', render: (row) => <span className="text-xs text-slate-600">{row.filters ?? 'Sin filtros'}</span> },
                ]}
                rowKey={(row) => String(row.id)}
                rows={historyQuery.data}
              />
            ) : null}
          </ReportPanel>
        ) : null}
      </section>

      {canViewAudit ? (
        <ReportPanel
          badge={auditQuery.isLoading ? 'Cargando' : auditQuery.isError ? 'Error' : 'Listo'}
          description="Contrato real `GET /api/v1/auditoria/operaciones`."
          title="Auditoría operativa"
          tone={auditQuery.isError ? 'warning' : auditQuery.isLoading ? 'neutral' : 'success'}
        >
          {auditQuery.isLoading ? <ResourceState body="Consultando auditoría..." title="Cargando auditoría" /> : null}
          {auditQuery.isError ? <ResourceState body={getApiErrorMessage(auditQuery.error, 'No se pudo consultar la auditoría operativa.')} title="Error en auditoría" tone="danger" /> : null}
          {auditQuery.data ? (
            <ResourceTable<AuditOperationDto>
              columns={[
                {
                  key: 'module',
                  header: 'Módulo',
                  render: (row) => (
                    <div>
                      <p className="font-medium text-slate-900">{row.module}</p>
                      <p className="text-xs text-slate-500">{row.operationType}</p>
                    </div>
                  ),
                },
                {
                  key: 'entity',
                  header: 'Entidad',
                  render: (row) => (
                    <div>
                      <p>{row.entityType}</p>
                      <p className="text-xs text-slate-500">{row.entityId}</p>
                    </div>
                  ),
                },
                { key: 'username', header: 'Usuario', render: (row) => row.username },
                { key: 'occurredAt', header: 'Fecha', render: (row) => formatDateTime(row.occurredAt) },
                { key: 'detail', header: 'Detalle', render: (row) => <span className="text-xs text-slate-600">{row.detail ?? 'Sin detalle'}</span> },
              ]}
              rowKey={(row) => String(row.id)}
              rows={auditQuery.data}
            />
          ) : null}
        </ReportPanel>
      ) : null}

      <ReportPanel
        badge={healthQuery.isLoading ? 'Cargando' : healthQuery.isError ? 'Error' : 'Listo'}
        description="Lectura técnica de `GET /api/v1/system/health`."
        title="Estado técnico"
        tone={healthQuery.isError ? 'warning' : healthQuery.isLoading ? 'neutral' : 'success'}
      >
        {healthQuery.isLoading ? <ResourceState body="Consultando estado del backend..." title="Cargando health check" /> : null}
        {healthQuery.isError ? <ResourceState body={getApiErrorMessage(healthQuery.error, 'No se pudo consultar el estado del backend.')} title="Error en health check" tone="danger" /> : null}
        {healthQuery.data ? (
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard helper="Estado publicado por backend." label="Estado" value={healthQuery.data.status} />
            <MetricCard helper="Aplicación reportada." label="Aplicación" value={healthQuery.data.application} />
            <MetricCard helper="Perfiles activos." label="Perfiles" value={healthQuery.data.profiles.join(', ') || 'Sin perfil'} />
          </div>
        ) : null}
      </ReportPanel>
    </ResourcePageShell>
  );
}
