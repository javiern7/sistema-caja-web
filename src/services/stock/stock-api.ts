import { httpClient } from '../api/httpClient';
import type { ApiResponse, StockCurrentDto, StockMovementDto } from '../api/types';

export async function fetchCurrentStock() {
  const response = await httpClient.get<ApiResponse<StockCurrentDto[]>>('/stock');
  return response.data;
}

export async function fetchStockMovements() {
  const response = await httpClient.get<ApiResponse<StockMovementDto[]>>('/stock/movimientos');
  return response.data;
}
