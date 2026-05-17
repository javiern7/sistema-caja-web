import { httpClient } from '../api/httpClient';
import type { ApiResponse, CreateProductRequest, CreateProviderRequest, ProductDto, ProviderDto } from '../api/types';

export async function fetchProducts() {
  const response = await httpClient.get<ApiResponse<ProductDto[]>>('/productos');
  return response.data;
}

export async function fetchProviders() {
  const response = await httpClient.get<ApiResponse<ProviderDto[]>>('/proveedores');
  return response.data;
}

export async function createProduct(payload: CreateProductRequest) {
  const response = await httpClient.post<ApiResponse<ProductDto>>('/productos', payload);
  return response.data;
}

export async function createProvider(payload: CreateProviderRequest) {
  const response = await httpClient.post<ApiResponse<ProviderDto>>('/proveedores', payload);
  return response.data;
}
