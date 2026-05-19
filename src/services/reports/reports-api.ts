import { httpClient } from '../api/httpClient';
import type {
  ApiResponse,
  AuditOperationDto,
  CashReportDto,
  ExpenseReportDto,
  PurchaseReportDto,
  ReportFilters,
  ReportHistoryDto,
  SalesReportDto,
  StockReportDto,
  SystemHealthDto,
  UtilityReportDto,
} from '../api/types';

function buildReportQuery(filters?: ReportFilters) {
  const query = new URLSearchParams();

  if (filters?.fechaDesde) {
    query.set('fechaDesde', filters.fechaDesde);
  }

  if (filters?.fechaHasta) {
    query.set('fechaHasta', filters.fechaHasta);
  }

  if (typeof filters?.operationalContextId === 'number') {
    query.set('operationalContextId', String(filters.operationalContextId));
  }

  return query.toString() ? `?${query.toString()}` : '';
}

export async function fetchAuditOperations(filters?: { module?: string; username?: string }) {
  const query = new URLSearchParams();
  if (filters?.module) {
    query.set('module', filters.module);
  }
  if (filters?.username) {
    query.set('username', filters.username);
  }
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await httpClient.get<ApiResponse<AuditOperationDto[]>>(`/auditoria/operaciones${suffix}`);
  return response.data;
}

export async function fetchSystemHealth() {
  const response = await httpClient.get<ApiResponse<SystemHealthDto>>('/system/health');
  return response.data;
}

export async function fetchSalesReport(filters?: ReportFilters) {
  const response = await httpClient.get<ApiResponse<SalesReportDto>>(`/reportes/ventas${buildReportQuery(filters)}`);
  return response.data;
}

export async function fetchCashReport(filters?: ReportFilters) {
  const response = await httpClient.get<ApiResponse<CashReportDto>>(`/reportes/caja${buildReportQuery(filters)}`);
  return response.data;
}

export async function fetchPurchaseReport(filters?: ReportFilters) {
  const response = await httpClient.get<ApiResponse<PurchaseReportDto>>(`/reportes/compras${buildReportQuery(filters)}`);
  return response.data;
}

export async function fetchExpenseReport(filters?: ReportFilters) {
  const response = await httpClient.get<ApiResponse<ExpenseReportDto>>(`/reportes/egresos${buildReportQuery(filters)}`);
  return response.data;
}

export async function fetchStockReport(filters?: ReportFilters) {
  const response = await httpClient.get<ApiResponse<StockReportDto>>(`/reportes/stock${buildReportQuery(filters)}`);
  return response.data;
}

export async function fetchUtilityReport(filters?: ReportFilters) {
  const response = await httpClient.get<ApiResponse<UtilityReportDto>>(`/reportes/utilidad${buildReportQuery(filters)}`);
  return response.data;
}

export async function fetchReportHistory(filters?: { reportType?: string; generatedBy?: string }) {
  const query = new URLSearchParams();

  if (filters?.reportType) {
    query.set('reportType', filters.reportType);
  }

  if (filters?.generatedBy) {
    query.set('generatedBy', filters.generatedBy);
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await httpClient.get<ApiResponse<ReportHistoryDto[]>>(`/reportes/historial${suffix}`);
  return response.data;
}
