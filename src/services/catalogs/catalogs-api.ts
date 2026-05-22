import { httpClient } from '../api/httpClient';
import { buildQueryString, fetchAllPages, SELECTOR_PAGE_SIZE } from '../api/pagination';
import type {
  ApiResponse,
  CreateProductRequest,
  CreateProviderRequest,
  PaginatedResponse,
  PaginationParams,
  ProductDto,
  ProviderDto,
  UpdateProviderRequest,
} from '../api/types';

export async function fetchProductsPage(params: PaginationParams = {}) {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<ProductDto>>>(
    `/productos${buildQueryString(params)}`,
  );
  return response.data;
}

export async function fetchProducts() {
  return fetchAllPages((params) => fetchProductsPage(params), {
    size: SELECTOR_PAGE_SIZE,
    sort: 'name,asc',
  });
}

export async function fetchProvidersPage(params: PaginationParams = {}) {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<ProviderDto>>>(
    `/proveedores${buildQueryString(params)}`,
  );
  return response.data;
}

export async function fetchProviders() {
  return fetchAllPages((params) => fetchProvidersPage(params), {
    size: SELECTOR_PAGE_SIZE,
    sort: 'name,asc',
  });
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
