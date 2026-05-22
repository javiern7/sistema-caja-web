import { httpClient } from '../api/httpClient';
import { buildQueryString } from '../api/pagination';
import type {
  ApiResponse,
  CreateOperationalContextRequest,
  OperationalContextDto,
  PaginatedResponse,
  PaginationParams,
  UpdateOperationalContextRequest,
} from '../api/types';

export async function fetchOperationalContextsAdmin(params: PaginationParams = {}) {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<OperationalContextDto>>>(
    `/negocios-eventos${buildQueryString(params)}`,
  );
  return response.data;
}

export async function createOperationalContext(payload: CreateOperationalContextRequest) {
  const response = await httpClient.post<ApiResponse<OperationalContextDto>>('/negocios-eventos', payload);
  return response.data;
}

export async function updateOperationalContext(operationalContextId: number, payload: UpdateOperationalContextRequest) {
  const response = await httpClient.put<ApiResponse<OperationalContextDto>>(`/negocios-eventos/${operationalContextId}`, payload);
  return response.data;
}
