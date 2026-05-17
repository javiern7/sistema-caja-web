import { httpClient } from '../api/httpClient';
import type { ApiResponse, CreateSaleRequest, SaleDto } from '../api/types';

export async function fetchSales() {
  const response = await httpClient.get<ApiResponse<SaleDto[]>>('/ventas');
  return response.data;
}

export async function createSale(payload: CreateSaleRequest) {
  const response = await httpClient.post<ApiResponse<SaleDto>>('/ventas', payload);
  return response.data;
}
