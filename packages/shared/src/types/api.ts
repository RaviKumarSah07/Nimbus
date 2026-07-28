export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFieldError {
  path: string;
  message: string;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code?: string;
    fields?: ApiFieldError[];
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}
