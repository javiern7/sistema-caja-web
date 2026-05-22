import { httpClient } from '../api/httpClient';
import { buildQueryString } from '../api/pagination';
import type {
  ApiResponse,
  CancelSaleRequest,
  CreateSaleRequest,
  PaginatedResponse,
  PaginationParams,
  SaleDto,
  SaleListItemDto,
} from '../api/types';

export async function fetchSales(params: PaginationParams = {}) {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<SaleListItemDto>>>(
    `/ventas${buildQueryString(params)}`,
  );
  return response.data;
}

export async function createSale(payload: CreateSaleRequest) {
  const response = await httpClient.post<ApiResponse<SaleDto>>('/ventas', payload);
  return response.data;
}

export async function fetchSaleDetail(saleId: number) {
  const response = await httpClient.get<ApiResponse<SaleDto>>(`/ventas/${saleId}`);
  return response.data;
}

export async function cancelSale(saleId: number, payload: CancelSaleRequest) {
  const response = await httpClient.post<ApiResponse<SaleDto>>(`/ventas/${saleId}/anulacion`, payload);
  return response.data;
}
