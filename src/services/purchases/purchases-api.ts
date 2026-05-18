import { httpClient } from '../api/httpClient';
import type { ApiResponse, CancelPurchaseRequest, CreatePurchaseRequest, PurchaseDto } from '../api/types';

export async function fetchPurchases() {
  const response = await httpClient.get<ApiResponse<PurchaseDto[]>>('/compras');
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
