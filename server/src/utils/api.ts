// Server-specific API utilities
import type { ApiResponse } from '../types';

/**
 * Creates consistent API success responses
 */
export function createSuccessResponse<T>(data: T, message = 'Success'): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates consistent API error responses
 */
export function createErrorResponse(
  error: string, 
  code?: string
): ApiResponse {
  return {
    success: false,
    error,
    code,
    timestamp: new Date().toISOString()
  };
}