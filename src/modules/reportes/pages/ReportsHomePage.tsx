import { useEffect, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ResourcePageShell } from '../../../components/ui/ResourcePageShell';
import { ResourceState } from '../../../components/ui/ResourceState';
import { ResourceTable } from '../../../components/ui/ResourceTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { getApiErrorMessage } from '../../../services/api/errors';
import { DEFAULT_PAGE_SIZE } from '../../../services/api/pagination';
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
  fetchCashReportDetail,
  fetchExpenseReport,
  fetchExpenseReportDetail,
  fetchPurchaseReport,
  fetchPurchaseReportDetail,
  fetchReportHistory,
  fetchSalesReport,
  fetchSalesReportDetail,
  fetchStockReport,
  fetchStockReportDetail,
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
  const [salesPage, setSalesPage] = useState(0);
  const [salesPageSize, setSalesPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [salesSort, setSalesSort] = useState('createdAt,desc');
  const [cashPage, setCashPage] = useState(0);
  const [cashPageSize, setCashPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [cashSort, setCashSort] = useState('openedAt,desc');
  const [purchasesPage, setPurchasesPage] = useState(0);
  const [purchasesPageSize, setPurchasesPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [purchasesSort, setPurchasesSort] = useState('purchaseDate,desc');
  const [expensesPage, setExpensesPage] = useState(0);
  const [expensesPageSize, setExpensesPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [expensesSort, setExpensesSort] = useState('expenseDate,desc');
  const [stockPage, setStockPage] = useState(0);
  const [stockPageSize, setStockPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [stockSort, setStockSort] = useState('productName,asc');
  const [historyPage, setHistoryPage] = useState(0);
  const [historyPageSize, setHistoryPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [historySort, setHistorySort] = useState('generatedAt,desc');
  const [auditPage, setAuditPage] = useState(0);
  const [auditPageSize, setAuditPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [auditSort, setAuditSort] = useState('occurredAt,desc');

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

  useEffect(() => {
    setSalesPage(0);
    setCashPage(0);
    setPurchasesPage(0);
    setExpensesPage(0);
    setStockPage(0);
  }, [dateFrom, dateTo, activeContext?.id]);

  useEffect(() => {
    setAuditPage(0);
  }, [moduleFilter, usernameFilter]);

  useEffect(() => {
    setHistoryPage(0);
  }, [reportTypeFilter, generatedByFilter]);

  const auditQuery = useQuery({
    queryKey: ['reports', 'audit', moduleFilter, usernameFilter, auditPage, auditPageSize, auditSort],
    queryFn: () =>
      fetchAuditOperations({
        module: moduleFilter || undefined,
        username: usernameFilter || undefined,
        page: auditPage,
        size: auditPageSize,
        sort: auditSort,
      }),
    enabled: canViewAudit,
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const healthQuery = useQuery({
    queryKey: ['reports', 'system-health'],
    queryFn: fetchSystemHealth,
    retry: false,
  });

  const salesSummaryQuery = useQuery({
    queryKey: ['reports', 'sales', reportFilters],
    queryFn: () => fetchSalesReport(reportFilters),
    enabled: canViewSales,
    retry: false,
  });

  const salesDetailQuery = useQuery({
    queryKey: ['reports', 'sales', 'detail', reportFilters, salesPage, salesPageSize, salesSort],
    queryFn: () => fetchSalesReportDetail({ ...reportFilters, page: salesPage, size: salesPageSize, sort: salesSort }),
    enabled: canViewSales,
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const cashSummaryQuery = useQuery({
    queryKey: ['reports', 'cash', reportFilters],
    queryFn: () => fetchCashReport(reportFilters),
    enabled: canViewCash,
    retry: false,
  });

  const cashDetailQuery = useQuery({
    queryKey: ['reports', 'cash', 'detail', reportFilters, cashPage, cashPageSize, cashSort],
    queryFn: () => fetchCashReportDetail({ ...reportFilters, page: cashPage, size: cashPageSize, sort: cashSort }),
    enabled: canViewCash,
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const purchasesSummaryQuery = useQuery({
    queryKey: ['reports', 'purchases', reportFilters],
    queryFn: () => fetchPurchaseReport(reportFilters),
    enabled: canViewPurchases,
    retry: false,
  });

  const purchasesDetailQuery = useQuery({
    queryKey: ['reports', 'purchases', 'detail', reportFilters, purchasesPage, purchasesPageSize, purchasesSort],
    queryFn: () =>
      fetchPurchaseReportDetail({ ...reportFilters, page: purchasesPage, size: purchasesPageSize, sort: purchasesSort }),
    enabled: canViewPurchases,
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const expensesSummaryQuery = useQuery({
    queryKey: ['reports', 'expenses', reportFilters],
    queryFn: () => fetchExpenseReport(reportFilters),
    enabled: canViewExpenses,
    retry: false,
  });

  const expensesDetailQuery = useQuery({
    queryKey: ['reports', 'expenses', 'detail', reportFilters, expensesPage, expensesPageSize, expensesSort],
    queryFn: () =>
      fetchExpenseReportDetail({ ...reportFilters, page: expensesPage, size: expensesPageSize, sort: expensesSort }),
    enabled: canViewExpenses,
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const stockSummaryQuery = useQuery({
    queryKey: ['reports', 'stock', reportFilters],
    queryFn: () => fetchStockReport(reportFilters),
    enabled: canViewStock,
    retry: false,
  });

  const stockDetailQuery = useQuery({
    queryKey: ['reports', 'stock', 'detail', reportFilters, stockPage, stockPageSize, stockSort],
    queryFn: () => fetchStockReportDetail({ ...reportFilters, page: stockPage, size: stockPageSize, sort: stockSort }),
    enabled: canViewStock,
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const utilityQuery = useQuery({
    queryKey: ['reports', 'utility', reportFilters],
    queryFn: () => fetchUtilityReport(reportFilters),
    enabled: canViewUtility,
    retry: false,
  });

  const historyQuery = useQuery({
    queryKey: ['reports', 'history', reportTypeFilter, generatedByFilter, historyPage, historyPageSize, historySort],
    queryFn: () =>
      fetchReportHistory({
        reportType: reportTypeFilter || undefined,
        generatedBy: generatedByFilter || undefined,
        page: historyPage,
        size: historyPageSize,
        sort: historySort,
      }),
    enabled: canViewHistory,
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const operations = auditQuery.data?.items ?? [];
  const historyRows = historyQuery.data?.items ?? [];
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
          <MetricCard helper="Eventos de auditoria visibles." label="Auditoria" value={String(auditQuery.data?.totalElements ?? operations.length)} />
          <MetricCard helper="Historial de reportes visible." label="Historial" value={String(historyQuery.data?.totalElements ?? historyRows.length)} />
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
          badge={salesSummaryQuery.isLoading ? 'Cargando' : salesSummaryQuery.isError ? 'Error' : 'Listo'}
          description="Contrato real `GET /api/v1/reportes/ventas`."
          title="Reporte de ventas"
          tone={salesSummaryQuery.isError ? 'warning' : salesSummaryQuery.isLoading ? 'neutral' : 'success'}
        >
          {salesSummaryQuery.isLoading ? <ResourceState body="Consultando reporte de ventas..." title="Cargando ventas" /> : null}
          {salesSummaryQuery.isError ? <ResourceState body={getApiErrorMessage(salesSummaryQuery.error, 'No se pudo consultar el reporte de ventas.')} title="Error en reporte de ventas" tone="danger" /> : null}
          {salesSummaryQuery.data ? (
            <>
              <div className="mb-5 grid gap-4 md:grid-cols-3">
                <MetricCard helper="Ventas efectivas devueltas por el backend." label="Total ventas" value={String(salesSummaryQuery.data.totalSales)} />
                <MetricCard helper="Monto consolidado del reporte." label="Monto" value={formatCurrency(salesSummaryQuery.data.totalAmount)} />
                <MetricCard helper="Filas detalladas visibles en la pagina actual." label="Filas" value={String(salesDetailQuery.data?.items.length ?? 0)} />
              </div>
              <ResourceTable<SalesReportRowDto>
                columns={[
                  {
                    key: 'receipt',
                    header: 'Comprobante',
                    sortable: true,
                    sortKey: 'internalReceipt',
                    render: (row) => (
                      <div>
                        <p className="font-medium text-slate-900">{row.internalReceipt ?? `Venta ${row.saleId}`}</p>
                        <p className="text-xs text-slate-500">{row.operationalContextName ?? 'Sin contexto'}</p>
                      </div>
                    ),
                  },
                  { key: 'seller', header: 'Usuario', render: (row) => row.soldByUsername ?? 'No disponible' },
                  { key: 'date', header: 'Fecha', sortable: true, sortKey: 'createdAt', render: (row) => formatDateTime(row.createdAt) },
                  { key: 'itemsCount', header: 'Items', sortable: true, sortKey: 'itemsCount', render: (row) => String(row.itemsCount) },
                  { key: 'amount', header: 'Monto', sortable: true, sortKey: 'totalAmount', render: (row) => formatCurrency(row.totalAmount) },
                ]}
                emptyState={<p className="text-sm text-slate-500">No hay ventas para el periodo y contexto seleccionados.</p>}
                isLoading={salesDetailQuery.isFetching}
                onPageChange={setSalesPage}
                onPageSizeChange={(nextSize) => {
                  setSalesPageSize(nextSize);
                  setSalesPage(0);
                }}
                pagination={salesDetailQuery.data}
                rowKey={(row) => String(row.saleId)}
                rows={salesDetailQuery.data?.items ?? []}
                sort={{
                  value: salesSort,
                  onChange: (nextSort) => {
                    setSalesSort(nextSort);
                    setSalesPage(0);
                  },
                }}
              />
            </>
          ) : null}
        </ReportPanel>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        {canViewCash ? (
          <ReportPanel
            badge={cashSummaryQuery.isLoading ? 'Cargando' : cashSummaryQuery.isError ? 'Error' : 'Listo'}
            description="Contrato real `GET /api/v1/reportes/caja`."
            title="Reporte de caja"
            tone={cashSummaryQuery.isError ? 'warning' : cashSummaryQuery.isLoading ? 'neutral' : 'success'}
          >
            {cashSummaryQuery.isLoading ? <ResourceState body="Consultando reporte de caja..." title="Cargando caja" /> : null}
            {cashSummaryQuery.isError ? <ResourceState body={getApiErrorMessage(cashSummaryQuery.error, 'No se pudo consultar el reporte de caja.')} title="Error en reporte de caja" tone="danger" /> : null}
            {cashSummaryQuery.data ? (
              <>
                <div className="mb-5 grid gap-4 md:grid-cols-2">
                  <MetricCard helper="Cajas devueltas por el backend." label="Cajas" value={String(cashSummaryQuery.data.totalCashBoxes)} />
                  <MetricCard helper="Diferencia total consolidada." label="Diferencia" value={formatCurrency(cashSummaryQuery.data.totalDifferenceAmount)} />
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
                    { key: 'status', header: 'Estado', sortable: true, sortKey: 'status', render: (row) => <StatusBadge label={row.status} tone={row.status === 'ABIERTA' ? 'success' : 'warning'} /> },
                    { key: 'openedBy', header: 'Apertura', render: (row) => row.openedByUsername ?? 'No disponible' },
                    { key: 'expected', header: 'Esperado', sortable: true, sortKey: 'expectedAmount', render: (row) => formatCurrency(row.expectedAmount) },
                    { key: 'difference', header: 'Diferencia', sortable: true, sortKey: 'differenceAmount', render: (row) => formatCurrency(row.differenceAmount) },
                  ]}
                  emptyState={<p className="text-sm text-slate-500">No hay cajas para el periodo y contexto seleccionados.</p>}
                  isLoading={cashDetailQuery.isFetching}
                  onPageChange={setCashPage}
                  onPageSizeChange={(nextSize) => {
                    setCashPageSize(nextSize);
                    setCashPage(0);
                  }}
                  pagination={cashDetailQuery.data}
                  rowKey={(row) => String(row.cashBoxId)}
                  rows={cashDetailQuery.data?.items ?? []}
                  sort={{
                    value: cashSort,
                    onChange: (nextSort) => {
                      setCashSort(nextSort);
                      setCashPage(0);
                    },
                  }}
                />
              </>
            ) : null}
          </ReportPanel>
        ) : null}

        {canViewPurchases ? (
          <ReportPanel
            badge={purchasesSummaryQuery.isLoading ? 'Cargando' : purchasesSummaryQuery.isError ? 'Error' : 'Listo'}
            description="Contrato real `GET /api/v1/reportes/compras`."
            title="Reporte de compras"
            tone={purchasesSummaryQuery.isError ? 'warning' : purchasesSummaryQuery.isLoading ? 'neutral' : 'success'}
          >
            {purchasesSummaryQuery.isLoading ? <ResourceState body="Consultando reporte de compras..." title="Cargando compras" /> : null}
            {purchasesSummaryQuery.isError ? <ResourceState body={getApiErrorMessage(purchasesSummaryQuery.error, 'No se pudo consultar el reporte de compras.')} title="Error en reporte de compras" tone="danger" /> : null}
            {purchasesSummaryQuery.data ? (
              <>
                <div className="mb-5 grid gap-4 md:grid-cols-2">
                  <MetricCard helper="Compras incluidas en el reporte." label="Compras" value={String(purchasesSummaryQuery.data.totalPurchases)} />
                  <MetricCard helper="Monto efectivo consolidado." label="Monto" value={formatCurrency(purchasesSummaryQuery.data.totalAmount)} />
                </div>
                <ResourceTable<PurchaseReportRowDto>
                  columns={[
                    { key: 'provider', header: 'Proveedor', sortable: true, sortKey: 'providerName', render: (row) => row.providerName ?? 'No disponible' },
                    { key: 'status', header: 'Estado', sortable: true, sortKey: 'status', render: (row) => <StatusBadge label={row.status} tone={row.status === 'REGISTRADA' ? 'success' : 'warning'} /> },
                    { key: 'date', header: 'Fecha', sortable: true, sortKey: 'purchaseDate', render: (row) => formatDate(row.purchaseDate) },
                    { key: 'context', header: 'Contexto', render: (row) => row.operationalContextName ?? 'Sin contexto' },
                    { key: 'amount', header: 'Monto', sortable: true, sortKey: 'effectiveAmount', render: (row) => formatCurrency(row.effectiveAmount) },
                  ]}
                  emptyState={<p className="text-sm text-slate-500">No hay compras para el periodo y contexto seleccionados.</p>}
                  isLoading={purchasesDetailQuery.isFetching}
                  onPageChange={setPurchasesPage}
                  onPageSizeChange={(nextSize) => {
                    setPurchasesPageSize(nextSize);
                    setPurchasesPage(0);
                  }}
                  pagination={purchasesDetailQuery.data}
                  rowKey={(row) => String(row.purchaseId)}
                  rows={purchasesDetailQuery.data?.items ?? []}
                  sort={{
                    value: purchasesSort,
                    onChange: (nextSort) => {
                      setPurchasesSort(nextSort);
                      setPurchasesPage(0);
                    },
                  }}
                />
              </>
            ) : null}
          </ReportPanel>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {canViewExpenses ? (
          <ReportPanel
            badge={expensesSummaryQuery.isLoading ? 'Cargando' : expensesSummaryQuery.isError ? 'Error' : 'Listo'}
            description="Contrato real `GET /api/v1/reportes/egresos`."
            title="Reporte de egresos"
            tone={expensesSummaryQuery.isError ? 'warning' : expensesSummaryQuery.isLoading ? 'neutral' : 'success'}
          >
            {expensesSummaryQuery.isLoading ? <ResourceState body="Consultando reporte de egresos..." title="Cargando egresos" /> : null}
            {expensesSummaryQuery.isError ? <ResourceState body={getApiErrorMessage(expensesSummaryQuery.error, 'No se pudo consultar el reporte de egresos.')} title="Error en reporte de egresos" tone="danger" /> : null}
            {expensesSummaryQuery.data ? (
              <>
                <div className="mb-5 grid gap-4 md:grid-cols-2">
                  <MetricCard helper="Egresos devueltos por el backend." label="Egresos" value={String(expensesSummaryQuery.data.totalExpenses)} />
                  <MetricCard helper="Monto consolidado." label="Monto" value={formatCurrency(expensesSummaryQuery.data.totalAmount)} />
                </div>
                <ResourceTable<ExpenseReportRowDto>
                  columns={[
                    { key: 'type', header: 'Tipo', sortable: true, sortKey: 'expenseType', render: (row) => <StatusBadge label={row.expenseType} tone="neutral" /> },
                    { key: 'category', header: 'Categoria', sortable: true, sortKey: 'category', render: (row) => row.category },
                    { key: 'description', header: 'Descripcion', render: (row) => row.description },
                    { key: 'date', header: 'Fecha', sortable: true, sortKey: 'expenseDate', render: (row) => formatDate(row.expenseDate) },
                    { key: 'amount', header: 'Monto', sortable: true, sortKey: 'amount', render: (row) => formatCurrency(row.amount) },
                  ]}
                  emptyState={<p className="text-sm text-slate-500">No hay egresos para el periodo y contexto seleccionados.</p>}
                  isLoading={expensesDetailQuery.isFetching}
                  onPageChange={setExpensesPage}
                  onPageSizeChange={(nextSize) => {
                    setExpensesPageSize(nextSize);
                    setExpensesPage(0);
                  }}
                  pagination={expensesDetailQuery.data}
                  rowKey={(row) => String(row.expenseId)}
                  rows={expensesDetailQuery.data?.items ?? []}
                  sort={{
                    value: expensesSort,
                    onChange: (nextSort) => {
                      setExpensesSort(nextSort);
                      setExpensesPage(0);
                    },
                  }}
                />
              </>
            ) : null}
          </ReportPanel>
        ) : null}

        {canViewStock ? (
          <ReportPanel
            badge={stockSummaryQuery.isLoading ? 'Cargando' : stockSummaryQuery.isError ? 'Error' : 'Listo'}
            description="Contrato real `GET /api/v1/reportes/stock`."
            title="Reporte de stock"
            tone={stockSummaryQuery.isError ? 'warning' : stockSummaryQuery.isLoading ? 'neutral' : 'success'}
          >
            {stockSummaryQuery.isLoading ? <ResourceState body="Consultando reporte de stock..." title="Cargando stock" /> : null}
            {stockSummaryQuery.isError ? <ResourceState body={getApiErrorMessage(stockSummaryQuery.error, 'No se pudo consultar el reporte de stock.')} title="Error en reporte de stock" tone="danger" /> : null}
            {stockSummaryQuery.data ? (
              <>
                <div className="mb-5 grid gap-4 md:grid-cols-2">
                  <MetricCard helper="Productos visibles en el reporte." label="Productos" value={String(stockSummaryQuery.data.totalProducts)} />
                  <MetricCard helper="Unidades globales reportadas." label="Unidades" value={String(stockSummaryQuery.data.totalUnits)} />
                </div>
                <ResourceTable<StockReportRowDto>
                  columns={[
                    {
                      key: 'product',
                      header: 'Producto',
                      sortable: true,
                      sortKey: 'productName',
                      render: (row) => (
                        <div>
                          <p className="font-medium text-slate-900">{row.productName}</p>
                          <p className="text-xs text-slate-500">{row.productCode}</p>
                        </div>
                      ),
                    },
                    { key: 'unit', header: 'Unidad', sortable: true, sortKey: 'unitOfMeasure', render: (row) => row.unitOfMeasure },
                    { key: 'currentStock', header: 'Stock actual', sortable: true, sortKey: 'currentStock', render: (row) => String(row.currentStock) },
                    { key: 'minimumStock', header: 'Minimo', sortable: true, sortKey: 'minimumStock', render: (row) => String(row.minimumStock) },
                    { key: 'status', header: 'Estado', sortable: true, sortKey: 'active', render: (row) => <StatusBadge label={row.active ? 'Activo' : 'Inactivo'} tone={row.active ? 'success' : 'warning'} /> },
                  ]}
                  emptyState={<p className="text-sm text-slate-500">No hay stock para el periodo y contexto seleccionados.</p>}
                  isLoading={stockDetailQuery.isFetching}
                  onPageChange={setStockPage}
                  onPageSizeChange={(nextSize) => {
                    setStockPageSize(nextSize);
                    setStockPage(0);
                  }}
                  pagination={stockDetailQuery.data}
                  rowKey={(row) => String(row.productId)}
                  rows={stockDetailQuery.data?.items ?? []}
                  sort={{
                    value: stockSort,
                    onChange: (nextSort) => {
                      setStockSort(nextSort);
                      setStockPage(0);
                    },
                  }}
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
                  { key: 'reportType', header: 'Reporte', sortable: true, sortKey: 'reportType', render: (row) => row.reportType },
                  { key: 'format', header: 'Formato', sortable: true, sortKey: 'format', render: (row) => row.format },
                  { key: 'generatedBy', header: 'Generado por', sortable: true, sortKey: 'generatedBy', render: (row) => row.generatedBy },
                  { key: 'generatedAt', header: 'Fecha', sortable: true, sortKey: 'generatedAt', render: (row) => formatDateTime(row.generatedAt) },
                  { key: 'filters', header: 'Filtros', render: (row) => <span className="text-xs text-slate-600">{row.filters ?? 'Sin filtros'}</span> },
                ]}
                emptyState={<p className="text-sm text-slate-500">No hay reportes generados con los filtros actuales.</p>}
                isLoading={historyQuery.isFetching}
                onPageChange={setHistoryPage}
                onPageSizeChange={(nextSize) => {
                  setHistoryPageSize(nextSize);
                  setHistoryPage(0);
                }}
                pagination={historyQuery.data}
                rowKey={(row) => String(row.id)}
                rows={historyQuery.data.items}
                sort={{
                  value: historySort,
                  onChange: (nextSort) => {
                    setHistorySort(nextSort);
                    setHistoryPage(0);
                  },
                }}
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
                  sortable: true,
                  sortKey: 'module',
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
                { key: 'occurredAt', header: 'Fecha', sortable: true, sortKey: 'occurredAt', render: (row) => formatDateTime(row.occurredAt) },
                { key: 'detail', header: 'Detalle', render: (row) => <span className="text-xs text-slate-600">{row.detail ?? 'Sin detalle'}</span> },
              ]}
              emptyState={<p className="text-sm text-slate-500">No hay operaciones de auditoria con los filtros actuales.</p>}
              isLoading={auditQuery.isFetching}
              onPageChange={setAuditPage}
              onPageSizeChange={(nextSize) => {
                setAuditPageSize(nextSize);
                setAuditPage(0);
              }}
              pagination={auditQuery.data}
              rowKey={(row) => String(row.id)}
              rows={auditQuery.data.items}
              sort={{
                value: auditSort,
                onChange: (nextSort) => {
                  setAuditSort(nextSort);
                  setAuditPage(0);
                },
              }}
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
