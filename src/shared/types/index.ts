export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code: string; message: string; details?: unknown };
}

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface RequestUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

export function errorResponse(code: string, message: string, details?: unknown): ApiResponse {
  return { success: false, error: { code, message, details } };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
