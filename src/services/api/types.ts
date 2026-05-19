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

export type UpdateProviderRequest = CreateProviderRequest;

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

export type UpdateUserRequest = {
  username: string;
  password?: string;
  roleId: number;
  active?: boolean;
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

export type UpdateRolePermissionsRequest = {
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

export type UpdateOperationalContextRequest = CreateOperationalContextRequest;

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

export type AuditOperationDto = {
  id: string | number;
  module: string;
  operationType: string;
  entityType: string;
  entityId: string;
  username: string;
  occurredAt?: string;
  detail?: string;
};

export type ReportFilters = {
  fechaDesde?: string;
  fechaHasta?: string;
  operationalContextId?: number;
};

export type SalesReportRowDto = {
  saleId: string | number;
  createdAt?: string;
  operationalContextId?: string | number;
  operationalContextName?: string;
  soldByUsername?: string;
  internalReceipt?: string;
  totalAmount: number;
  itemsCount: number;
};

export type SalesReportDto = {
  fechaDesde?: string;
  fechaHasta?: string;
  operationalContextId?: string | number;
  totalSales: number;
  totalAmount: number;
  items: SalesReportRowDto[];
};

export type CashReportRowDto = {
  cashBoxId: string | number;
  operationalContextId?: string | number;
  operationalContextName?: string;
  openedByUsername?: string;
  closedByUsername?: string;
  status: string;
  openingAmount: number;
  expectedAmount: number;
  countedAmount?: number | null;
  differenceAmount?: number | null;
  openedAt?: string;
  closedAt?: string;
};

export type CashReportDto = {
  fechaDesde?: string;
  fechaHasta?: string;
  operationalContextId?: string | number;
  totalCashBoxes: number;
  totalOpeningAmount: number;
  totalExpectedAmount: number;
  totalDifferenceAmount: number;
  items: CashReportRowDto[];
};

export type PurchaseReportRowDto = {
  purchaseId: string | number;
  purchaseDate?: string;
  operationalContextId?: string | number;
  operationalContextName?: string;
  providerName?: string;
  status: string;
  effectiveAmount: number;
};

export type PurchaseReportDto = {
  fechaDesde?: string;
  fechaHasta?: string;
  operationalContextId?: string | number;
  totalPurchases: number;
  totalAmount: number;
  items: PurchaseReportRowDto[];
};

export type ExpenseReportRowDto = {
  expenseId: string | number;
  expenseDate?: string;
  operationalContextId?: string | number;
  operationalContextName?: string;
  expenseType: string;
  category: string;
  description: string;
  amount: number;
  recordedByUsername?: string;
};

export type ExpenseReportDto = {
  fechaDesde?: string;
  fechaHasta?: string;
  operationalContextId?: string | number;
  totalExpenses: number;
  totalAmount: number;
  items: ExpenseReportRowDto[];
};

export type StockReportRowDto = {
  productId: string | number;
  productCode: string;
  productName: string;
  unitOfMeasure: string;
  active: boolean;
  stockControlled: boolean;
  minimumStock: number;
  currentStock: number;
  updatedAt?: string;
};

export type StockReportDto = {
  stockScope: string;
  totalProducts: number;
  totalUnits: number;
  items: StockReportRowDto[];
};

export type UtilityReportDto = {
  fechaDesde?: string;
  fechaHasta?: string;
  operationalContextId?: string | number;
  salesAmount: number;
  purchaseAmount: number;
  expenseAmount: number;
  estimatedCostOfSales: number;
  grossMargin: number;
  netUtility: number;
};

export type ReportHistoryDto = {
  id: string | number;
  reportType: string;
  format: string;
  generatedBy: string;
  filters?: string;
  generatedAt?: string;
};

export type SystemHealthDto = {
  status: string;
  application: string;
  profiles: string[];
  timestamp: string;
};
