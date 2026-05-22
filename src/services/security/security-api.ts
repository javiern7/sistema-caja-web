import { httpClient } from '../api/httpClient';
import { buildQueryString, fetchAllPages, SELECTOR_PAGE_SIZE } from '../api/pagination';
import type {
  ApiResponse,
  CreateRoleRequest,
  CreateUserRequest,
  PaginatedResponse,
  PaginationParams,
  RoleDto,
  UpdateRolePermissionsRequest,
  UpdateUserRequest,
  UserDto,
} from '../api/types';

export async function fetchUsersPage(params: PaginationParams = {}) {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<UserDto>>>(
    `/usuarios${buildQueryString(params)}`,
  );
  return response.data;
}

export async function fetchUsers() {
  return fetchAllPages((params) => fetchUsersPage(params), {
    size: SELECTOR_PAGE_SIZE,
    sort: 'username,asc',
  });
}

export async function fetchRolesPage(params: PaginationParams = {}) {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<RoleDto>>>(
    `/roles${buildQueryString(params)}`,
  );
  return response.data;
}

export async function fetchRoles() {
  return fetchAllPages((params) => fetchRolesPage(params), {
    size: SELECTOR_PAGE_SIZE,
    sort: 'name,asc',
  });
}

export async function createUser(payload: CreateUserRequest) {
  const response = await httpClient.post<ApiResponse<UserDto>>('/usuarios', payload);
  return response.data;
}

export async function createRole(payload: CreateRoleRequest) {
  const response = await httpClient.post<ApiResponse<RoleDto>>('/roles', payload);
  return response.data;
}

export async function updateUser(userId: number, payload: UpdateUserRequest) {
  const response = await httpClient.put<ApiResponse<UserDto>>(`/usuarios/${userId}`, payload);
  return response.data;
}

export async function updateUserStatus(userId: number, active: boolean) {
  const response = await httpClient.patch<ApiResponse<UserDto>>(`/usuarios/${userId}/estado`, { active });
  return response.data;
}

export async function updateRolePermissions(roleId: number, payload: UpdateRolePermissionsRequest) {
  const response = await httpClient.put<ApiResponse<RoleDto>>(`/roles/${roleId}/permisos`, payload);
  return response.data;
}
