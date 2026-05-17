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
  role?: string;
  roleName?: string;
  email?: string;
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

export type CashMovementDto = {
  id: string | number;
  movementType: string;
  amount: number;
  referenceType?: string;
  referenceId?: string;
  performedBy?: string;
  occurredAt?: string;
  observation?: string;
};

export type CashBoxDto = {
  id: string | number;
  operationalContextId: string | number;
  operationalContextCode?: string;
  operationalContextName?: string;
  openedByUserId?: string | number;
  openedByUsername?: string;
  status: 'ABIERTA' | 'CERRADA' | string;
  openingAmount: number;
  totalSales: number;
  additionalIncome: number;
  totalExpenses: number;
  expectedAmount: number;
  countedAmount?: number | null;
  differenceAmount?: number | null;
  openingObservation?: string;
  closingObservation?: string;
  openedAt?: string;
  closedAt?: string;
  closedByUsername?: string;
  movements: CashMovementDto[];
};

export type OpenCashBoxRequest = {
  operationalContextId: number;
  openingAmount: number;
  observation?: string;
};

export type CloseCashBoxRequest = {
  countedAmount: number;
  observation?: string;
};

export type StockCurrentDto = {
  productId: string | number;
  productCode: string;
  productName: string;
  unitOfMeasure: string;
  stockControlled: boolean;
  productActive: boolean;
  currentStock: number;
  minimumStock: number;
  updatedAt?: string;
};

export type StockMovementDto = {
  id: string | number;
  productId: string | number;
  productCode: string;
  productName: string;
  movementType: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  performedBy?: string;
  occurredAt?: string;
  note?: string;
};

export type SaleItemRequest = {
  productId: number;
  quantity: number;
  unitPrice: number;
};

export type SalePaymentRequest = {
  paymentMethod: string;
  amount: number;
};

export type CreateSaleRequest = {
  operationalContextId: number;
  cashBoxId: number;
  items: SaleItemRequest[];
  payments: SalePaymentRequest[];
  observation?: string;
};

export type CancelSaleRequest = {
  reason: string;
};

export type SaleItemDto = {
  id: string | number;
  productId: string | number;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotalAmount: number;
};

export type SalePaymentDto = {
  id: string | number;
  paymentMethod: string;
  amount: number;
};

export type SaleDto = {
  id: string | number;
  operationalContextId: string | number;
  operationalContextName?: string;
  cashBoxId: string | number;
  soldByUsername?: string;
  status: string;
  subtotalAmount: number;
  totalAmount: number;
  internalReceiptSeries?: string;
  internalReceiptNumber?: number;
  observation?: string;
  createdAt?: string;
  cancelledAt?: string;
  cancelledByUsername?: string;
  cancellationReason?: string;
  items: SaleItemDto[];
  payments: SalePaymentDto[];
};

export type PurchaseItemRequest = {
  productId: number;
  quantity: number;
  unitCost: number;
};

export type CreatePurchaseRequest = {
  operationalContextId: number;
  providerId: number;
  purchaseDate: string;
  documentType?: string;
  documentNumber?: string;
  paymentMethod?: string;
  items: PurchaseItemRequest[];
  observation?: string;
};

export type CancelPurchaseItemRequest = {
  purchaseItemId: number;
  cancelledQuantity: number;
};

export type CancelPurchaseRequest = {
  reason: string;
  cancelledItems: CancelPurchaseItemRequest[];
};

export type PurchaseItemDto = {
  id: string | number;
  productId: string | number;
  productCode: string;
  productName: string;
  quantity: number;
  cancelledQuantity: number;
  unitCost: number;
  subtotalAmount: number;
};

export type PurchaseDto = {
  id: string | number;
  operationalContextId: string | number;
  operationalContextName?: string;
  providerId: string | number;
  providerName?: string;
  status: string;
  purchaseDate: string;
  documentType?: string;
  documentNumber?: string;
  paymentMethod?: string;
  subtotalAmount: number;
  totalAmount: number;
  observation?: string;
  createdAt?: string;
  cancelledAt?: string;
  cancelledByUsername?: string;
  cancellationReason?: string;
  items: PurchaseItemDto[];
};

export type CreateExpenseRequest = {
  operationalContextId: number;
  cashBoxId?: number;
  expenseType: string;
  category: string;
  description: string;
  paymentMethod?: string;
  amount: number;
  responsible?: string;
  observation?: string;
  expenseDate: string;
};

export type ExpenseDto = {
  id: string | number;
  operationalContextId: string | number;
  operationalContextName?: string;
  cashBoxId?: string | number;
  expenseType: string;
  category: string;
  description: string;
  paymentMethod?: string;
  amount: number;
  responsible?: string;
  observation?: string;
  recordedByUsername?: string;
  expenseDate: string;
  createdAt?: string;
};
