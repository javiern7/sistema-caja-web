export type ApiErrorPayload = {
  code?: string;
  details?: string[];
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  error?: ApiErrorPayload;
};

export type AuthApiUser = {
  id: string | number;
  username?: string;
  displayName?: string;
  fullName?: string;
  role: string;
};

export type AuthSessionPayload = {
  token: string;
  user: AuthApiUser;
  permissions: string[];
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type OperationalContextDto = {
  id: string | number;
  code?: string;
  nombre?: string;
  name?: string;
  tipo?: string;
  kind?: string;
  type?: string;
  estado?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
};

export type ProductDto = {
  id: string | number;
  code: string;
  name: string;
  unitOfMeasure: string;
  salePrice: number;
  referenceCost: number;
  minimumStock: number;
  stockControlled: boolean;
  active: boolean;
  description?: string;
};

export type CreateProductRequest = {
  code: string;
  name: string;
  unitOfMeasure: string;
  salePrice: number;
  referenceCost: number;
  minimumStock: number;
  stockControlled: boolean;
  active: boolean;
  description?: string;
};

export type ProviderDto = {
  id: string | number;
  name: string;
  documentNumber?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  active: boolean;
};

export type CreateProviderRequest = {
  name: string;
  documentNumber?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  active: boolean;
};

export type UserDto = {
  id: string | number;
  username: string;
  active: boolean;
  roleId: string | number;
  roleName: string;
};

export type CreateUserRequest = {
  username: string;
  password: string;
  roleId: number;
  active: boolean;
};

export type RolePermissionDto = {
  code: string;
  description?: string;
};

export type RoleDto = {
  id: string | number;
  name: string;
  description?: string;
  permissions: RolePermissionDto[];
};

export type CreateRoleRequest = {
  name: string;
  description?: string;
  permissions: string[];
};

export type CreateOperationalContextRequest = {
  code: string;
  name: string;
  type: 'NEGOCIO' | 'EVENTO';
  status: 'PLANIFICADO' | 'EN_CURSO' | 'CERRADO' | 'CANCELADO';
  startDate: string;
  endDate?: string;
  description?: string;
};
