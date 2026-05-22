import { httpClient } from '../api/httpClient';
import { buildQueryString } from '../api/pagination';
import type {
  ApiResponse,
  CancelPurchaseRequest,
  CreatePurchaseRequest,
  PaginatedResponse,
  PaginationParams,
  PurchaseDto,
  PurchaseListItemDto,
} from '../api/types';

export async function fetchPurchases(params: PaginationParams = {}) {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<PurchaseListItemDto>>>(
    `/compras${buildQueryString(params)}`,
  );
  return response.data;
}

export async function createPurchase(payload: CreatePurchaseRequest) {
  const response = await httpClient.post<ApiResponse<PurchaseDto>>('/compras', payload);
  return response.data;
}

export async function fetchPurchaseDetail(purchaseId: number) {
  const response = await httpClient.get<ApiResponse<PurchaseDto>>(`/compras/${purchaseId}`);
  return response.data;
}

export async function cancelPurchase(purchaseId: number, payload: CancelPurchaseRequest) {
  const response = await httpClient.post<ApiResponse<PurchaseDto>>(`/compras/${purchaseId}/anulacion`, payload);
  return response.data;
}
