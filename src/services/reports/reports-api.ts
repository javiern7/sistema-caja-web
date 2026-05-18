import { httpClient } from '../api/httpClient';
import type { ApiResponse, AuditOperationDto, SystemHealthDto } from '../api/types';

export async function fetchAuditOperations(filters?: { module?: string; username?: string }) {
  const query = new URLSearchParams();
  if (filters?.module) {
    query.set('module', filters.module);
  }
  if (filters?.username) {
    query.set('username', filters.username);
  }
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await httpClient.get<ApiResponse<AuditOperationDto[]>>(`/auditoria/operaciones${suffix}`);
  return response.data;
}

export async function fetchSystemHealth() {
  const response = await httpClient.get<ApiResponse<SystemHealthDto>>('/system/health');
  return response.data;
}
