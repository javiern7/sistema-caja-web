import { httpClient } from '../api/httpClient';
import type { ApiResponse, CreateRoleRequest, CreateUserRequest, RoleDto, UserDto } from '../api/types';

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
