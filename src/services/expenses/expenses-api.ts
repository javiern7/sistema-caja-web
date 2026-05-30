import { httpClient } from '../api/httpClient';
import { buildQueryString } from '../api/pagination';
import type {
  ApiResponse,
  CreateExpenseRequest,
  ExpenseDto,
  PaginatedResponse,
  PaginationParams,
} from '../api/types';

type ExpensesQueryParams = PaginationParams & {
  operationalContextId: number;
};

export async function fetchExpenses(params: ExpensesQueryParams) {
  const response = await httpClient.get<ApiResponse<PaginatedResponse<ExpenseDto>>>(
    `/egresos${buildQueryString(params)}`,
  );
  return response.data;
}

export async function createExpense(payload: CreateExpenseRequest) {
  const response = await httpClient.post<ApiResponse<ExpenseDto>>('/egresos', payload);
  return response.data;
}

export async function fetchExpenseDetail(expenseId: number) {
  const response = await httpClient.get<ApiResponse<ExpenseDto>>(`/egresos/${expenseId}`);
  return response.data;
}
