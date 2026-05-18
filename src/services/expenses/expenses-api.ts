import { httpClient } from '../api/httpClient';
import type { ApiResponse, CreateExpenseRequest, ExpenseDto } from '../api/types';

export async function fetchExpenses() {
  const response = await httpClient.get<ApiResponse<ExpenseDto[]>>('/egresos');
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
