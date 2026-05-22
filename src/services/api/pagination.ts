import type { PaginatedResponse, PaginationParams } from './types';

type QueryValue = string | number | boolean | null | undefined;

type QueryParams = Record<string, QueryValue | QueryValue[]>;

export const DEFAULT_PAGE_SIZE = 10;
export const SELECTOR_PAGE_SIZE = 100;

export function buildQueryString(params: QueryParams) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          query.append(key, String(item));
        }
      });
      return;
    }

    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

export async function fetchAllPages<T>(
  fetchPage: (params: PaginationParams) => Promise<PaginatedResponse<T>>,
  params: Omit<PaginationParams, 'page'> = {},
) {
  const size = params.size ?? SELECTOR_PAGE_SIZE;
  const firstPage = await fetchPage({ ...params, page: 0, size });
  const items = [...firstPage.items];

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const nextPage = await fetchPage({ ...params, page, size });
    items.push(...nextPage.items);
    if (nextPage.last) {
      break;
    }
  }

  return items;
}
