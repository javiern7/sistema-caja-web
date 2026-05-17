import { httpClient } from '../api/httpClient';
import type { ApiResponse, AuthSessionPayload, LoginRequest } from '../api/types';

export async function loginRequest(payload: LoginRequest) {
  const response = await httpClient.post<ApiResponse<AuthSessionPayload>>('/auth/login', payload);
  return response.data;
}

export async function fetchCurrentSession() {
  const response = await httpClient.get<ApiResponse<Omit<AuthSessionPayload, 'token'>>>('/auth/me');
  return response.data;
}

export async function logoutRequest() {
  return httpClient.post<ApiResponse<null>>('/auth/logout');
}
