import { httpClient } from '../api/httpClient';
import { buildQueryString } from '../api/pagination';
import type {
  ApiResponse,
  CashBoxDto,
  CloseCashBoxRequest,
  OpenCashBoxRequest,
  PaginatedResponse,
  PaginationParams,
} from '../api/types';

export async function fetchActiveCashBox() {
  const response = await httpClient.get<ApiResponse<CashBoxDto>>('/cajas/activa');
  return response.data;
}

export async function fetchCashBoxSummary(cashBoxId: number) {
  const response = await httpClient.get<ApiResponse<CashBoxDto>>(`/cajas/${cashBoxId}/resumen`);
  return response.data;
}

export async function fetchCashBoxes(filters?: {
  status?: string;
  operationalContextId?: number;
  openedByUserId?: number;
} & PaginationParams) {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<CashBoxDto>>>(
    `/cajas${buildQueryString({
      status: filters?.status,
      operationalContextId: filters?.operationalContextId,
      openedByUserId: filters?.openedByUserId,
      page: filters?.page,
      size: filters?.size,
      sort: filters?.sort,
    })}`,
  );
  return response.data;
}

export async function openCashBox(payload: OpenCashBoxRequest) {
  const response = await httpClient.post<ApiResponse<CashBoxDto>>('/cajas/aperturas', payload);
  return response.data;
}

export async function closeCashBox(cashBoxId: number, payload: CloseCashBoxRequest) {
  const response = await httpClient.post<ApiResponse<CashBoxDto>>(`/cajas/${cashBoxId}/cierres`, payload);
  return response.data;
}
