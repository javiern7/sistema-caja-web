import { httpClient } from '../api/httpClient';
import type { ApiResponse, OperationalContextDto } from '../api/types';

export async function fetchOperationalContexts() {
  const response = await httpClient.get<ApiResponse<OperationalContextDto[]>>('/contextos-operativos');
  return response.data;
}
