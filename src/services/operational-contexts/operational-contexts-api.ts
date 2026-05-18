import { httpClient } from '../api/httpClient';
import type {
  ApiResponse,
  CreateOperationalContextRequest,
  OperationalContextDto,
  UpdateOperationalContextRequest,
} from '../api/types';

export async function fetchOperationalContextsAdmin() {
  const response = await httpClient.get<ApiResponse<OperationalContextDto[]>>('/negocios-eventos');
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
