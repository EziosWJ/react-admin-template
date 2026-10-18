export type SortOrder = 'asc' | 'desc';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BaseListQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface ApiErrorBody {
  message: string;
  code?: string;
  field?: string;
}
