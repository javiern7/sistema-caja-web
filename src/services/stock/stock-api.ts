import { httpClient } from '../api/httpClient';
import { buildQueryString, fetchAllPages, SELECTOR_PAGE_SIZE } from '../api/pagination';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  StockCurrentDto,
  StockMovementDto,
} from '../api/types';

type StockQueryParams = PaginationParams & {
  operationalContextId: number;
};

export async function fetchCurrentStockPage(params: StockQueryParams) {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<StockCurrentDto>>>(
    `/stock${buildQueryString(params)}`,
  );
  return response.data;
}

export async function fetchCurrentStock(operationalContextId: number) {
  return fetchAllPages((params) => fetchCurrentStockPage({ ...params, operationalContextId }), {
    size: SELECTOR_PAGE_SIZE,
  });
}

export async function fetchStockMovementsPage(params: StockQueryParams) {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<StockMovementDto>>>(
    `/stock/movimientos${buildQueryString(params)}`,
  );
  return response.data;
}

export async function fetchStockMovements(operationalContextId: number) {
  return fetchAllPages((params) => fetchStockMovementsPage({ ...params, operationalContextId }), {
    size: SELECTOR_PAGE_SIZE,
    sort: 'occurredAt,desc',
  });
}
