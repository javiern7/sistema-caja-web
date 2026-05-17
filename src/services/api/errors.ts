import { ApiError } from './httpClient';

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.apiMessage ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function getApiErrorCode(error: unknown) {
  if (error instanceof ApiError) {
    return error.apiCode ?? null;
  }

  return null;
}
