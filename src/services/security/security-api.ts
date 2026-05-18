import { httpClient } from '../api/httpClient';
import type {
  ApiResponse,
  CreateRoleRequest,
  CreateUserRequest,
  RoleDto,
  UpdateRolePermissionsRequest,
  UpdateUserRequest,
  UserDto,
} from '../api/types';

export async function fetchUsers() {
  const response = await httpClient.get<ApiResponse<UserDto[]>>('/usuarios');
  return response.data;
}

export async function fetchRoles() {
  const response = await httpClient.get<ApiResponse<RoleDto[]>>('/roles');
  return response.data;
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
