import { httpClient } from '../api/httpClient';
import { buildQueryString, fetchAllPages, SELECTOR_PAGE_SIZE } from '../api/pagination';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  StockCurrentDto,
  StockMovementDto,
} from '../api/types';

export async function fetchCurrentStockPage(params: PaginationParams = {}) {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<StockCurrentDto>>>(
    `/stock${buildQueryString(params)}`,
  );
  return response.data;
}

export async function fetchCurrentStock() {
  return fetchAllPages((params) => fetchCurrentStockPage(params), {
    size: SELECTOR_PAGE_SIZE,
  });
}

export async function fetchStockMovementsPage(params: PaginationParams = {}) {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<StockMovementDto>>>(
    `/stock/movimientos${buildQueryString(params)}`,
  );
  return response.data;
}

export async function fetchStockMovements() {
  return fetchAllPages((params) => fetchStockMovementsPage(params), {
    size: SELECTOR_PAGE_SIZE,
    sort: 'occurredAt,desc',
  });
}
