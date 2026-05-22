import { httpClient } from '../api/httpClient';
import { buildQueryString } from '../api/pagination';
import type {
  ApiResponse,
  AuditOperationDto,
  CashReportRowDto,
  CashReportDto,
  ExpenseReportRowDto,
  ExpenseReportDto,
  PaginatedResponse,
  PaginationParams,
  PurchaseReportRowDto,
  PurchaseReportDto,
  ReportFilters,
  ReportHistoryDto,
  SalesReportRowDto,
  SalesReportDto,
  StockReportRowDto,
  StockReportDto,
  SystemHealthDto,
  UtilityReportDto,
} from '../api/types';

function buildReportQuery(filters?: ReportFilters) {
  return buildQueryString({
    fechaDesde: filters?.fechaDesde,
    fechaHasta: filters?.fechaHasta,
    operationalContextId: filters?.operationalContextId,
  });
}

export async function fetchAuditOperations(
  filters?: { module?: string; username?: string } & PaginationParams,
) {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<AuditOperationDto>>>(
    `/auditoria/operaciones${buildQueryString({
      module: filters?.module,
      username: filters?.username,
      page: filters?.page,
      size: filters?.size,
      sort: filters?.sort,
    })}`,
  );
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

export async function fetchSalesReportDetail(filters?: ReportFilters & PaginationParams) {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<SalesReportRowDto>>>(
    `/reportes/ventas/detalle${buildQueryString({
      fechaDesde: filters?.fechaDesde,
      fechaHasta: filters?.fechaHasta,
      operationalContextId: filters?.operationalContextId,
      page: filters?.page,
      size: filters?.size,
      sort: filters?.sort,
    })}`,
  );
  return response.data;
}

export async function fetchCashReport(filters?: ReportFilters) {
  const response = await httpClient.get<ApiResponse<CashReportDto>>(`/reportes/caja${buildReportQuery(filters)}`);
  return response.data;
}

export async function fetchCashReportDetail(filters?: ReportFilters & PaginationParams) {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<CashReportRowDto>>>(
    `/reportes/caja/detalle${buildQueryString({
      fechaDesde: filters?.fechaDesde,
      fechaHasta: filters?.fechaHasta,
      operationalContextId: filters?.operationalContextId,
      page: filters?.page,
      size: filters?.size,
      sort: filters?.sort,
    })}`,
  );
  return response.data;
}

export async function fetchPurchaseReport(filters?: ReportFilters) {
  const response = await httpClient.get<ApiResponse<PurchaseReportDto>>(`/reportes/compras${buildReportQuery(filters)}`);
  return response.data;
}

export async function fetchPurchaseReportDetail(filters?: ReportFilters & PaginationParams) {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<PurchaseReportRowDto>>>(
    `/reportes/compras/detalle${buildQueryString({
      fechaDesde: filters?.fechaDesde,
      fechaHasta: filters?.fechaHasta,
      operationalContextId: filters?.operationalContextId,
      page: filters?.page,
      size: filters?.size,
      sort: filters?.sort,
    })}`,
  );
  return response.data;
}

export async function fetchExpenseReport(filters?: ReportFilters) {
  const response = await httpClient.get<ApiResponse<ExpenseReportDto>>(`/reportes/egresos${buildReportQuery(filters)}`);
  return response.data;
}

export async function fetchExpenseReportDetail(filters?: ReportFilters & PaginationParams) {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<ExpenseReportRowDto>>>(
    `/reportes/egresos/detalle${buildQueryString({
      fechaDesde: filters?.fechaDesde,
      fechaHasta: filters?.fechaHasta,
      operationalContextId: filters?.operationalContextId,
      page: filters?.page,
      size: filters?.size,
      sort: filters?.sort,
    })}`,
  );
  return response.data;
}

export async function fetchStockReport(filters?: ReportFilters) {
  const response = await httpClient.get<ApiResponse<StockReportDto>>(`/reportes/stock${buildReportQuery(filters)}`);
  return response.data;
}

export async function fetchStockReportDetail(filters?: ReportFilters & PaginationParams) {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<StockReportRowDto>>>(
    `/reportes/stock/detalle${buildQueryString({
      fechaDesde: filters?.fechaDesde,
      fechaHasta: filters?.fechaHasta,
      operationalContextId: filters?.operationalContextId,
      page: filters?.page,
      size: filters?.size,
      sort: filters?.sort,
    })}`,
  );
  return response.data;
}

export async function fetchUtilityReport(filters?: ReportFilters) {
  const response = await httpClient.get<ApiResponse<UtilityReportDto>>(`/reportes/utilidad${buildReportQuery(filters)}`);
  return response.data;
}

export async function fetchReportHistory(
  filters?: { reportType?: string; generatedBy?: string } & PaginationParams,
) {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<ReportHistoryDto>>>(
    `/reportes/historial${buildQueryString({
      reportType: filters?.reportType,
      generatedBy: filters?.generatedBy,
      page: filters?.page,
      size: filters?.size,
      sort: filters?.sort,
    })}`,
  );
  return response.data;
}
