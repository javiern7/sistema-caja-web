import { httpClient } from '../api/httpClient';
import type {
  ApiResponse,
  CreateProductRequest,
  CreateProviderRequest,
  ProductDto,
  ProviderDto,
  UpdateProviderRequest,
} from '../api/types';

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

export async function updateProduct(productId: number, payload: CreateProductRequest) {
  const response = await httpClient.put<ApiResponse<ProductDto>>(`/productos/${productId}`, payload);
  return response.data;
}

export async function updateProductStatus(productId: number, active: boolean) {
  const response = await httpClient.patch<ApiResponse<ProductDto>>(`/productos/${productId}/estado`, { active });
  return response.data;
}

export async function updateProvider(providerId: number, payload: UpdateProviderRequest) {
  const response = await httpClient.put<ApiResponse<ProviderDto>>(`/proveedores/${providerId}`, payload);
  return response.data;
}
