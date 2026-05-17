import { httpClient } from '../api/httpClient';
import type { ApiResponse, CreatePurchaseRequest, PurchaseDto } from '../api/types';

export async function fetchPurchases() {
  const response = await httpClient.get<ApiResponse<PurchaseDto[]>>('/compras');
  return response.data;
}

export async function createPurchase(payload: CreatePurchaseRequest) {
  const response = await httpClient.post<ApiResponse<PurchaseDto>>('/compras', payload);
  return response.data;
}
