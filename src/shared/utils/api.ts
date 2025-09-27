// Shared API utilities to reduce duplication
import type { ApiResponse, ApiError, TrendingData, ErrorCode } from '../types';

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
  code?: ErrorCode
): ApiResponse {
  const response: any = {
    success: false,
    error,
    timestamp: new Date().toISOString()
  };
  
  if (code) {
    response.code = code;
  }
  
  return response;
}

/**
 * Transforms date strings to Date objects in API responses
 * Reduces duplication in client-side API calls
 */
export function transformDatesInResponse(data: any): any {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(transformDatesInResponse);
  }
  
  if (typeof data === 'object' && data !== null) {
    const transformed = { ...data };
    
    // Transform common date fields
    if (transformed.lastUpdated) {
      transformed.lastUpdated = new Date(transformed.lastUpdated);
    }
    if (transformed.createdAt) {
      transformed.createdAt = new Date(transformed.createdAt);
    }
    if (transformed.expiresAt) {
      transformed.expiresAt = new Date(transformed.expiresAt);
    }
    
    return transformed;
  }
  
  return data;
}

/**
 * Generic error handler for API calls
 */
export function handleApiError(error: any): ApiError {
  const apiError: ApiError = new Error(error.message || 'An error occurred');
  
  if (error.response) {
    apiError.status = error.response.status;
    apiError.code = error.response.data?.code;
  }
  
  apiError.timestamp = new Date().toISOString();
  return apiError;
}

/**
 * Validates trending data structure
 */
export function validateTrendingData(data: any): data is TrendingData {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.keyword === 'string' &&
    Array.isArray(data.topics) &&
    data.topics.every((topic: any) => 
      topic &&
      typeof topic.title === 'string' &&
      typeof topic.summary === 'string' &&
      typeof topic.searchUrl === 'string'
    )
  );
}

/**
 * Creates Google search URL for a topic
 */
export function createSearchUrl(keyword: string, title?: string): string {
  const query = title ? `${keyword} ${title}` : keyword;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * Generates cache key consistently
 */
export function generateCacheKey(prefix: string, keyword: string): string {
  return `${prefix}:${keyword.toLowerCase().replace(/\s+/g, '_')}`;
}

/**
 * Calculates cache hit rate
 */
export function calculateHitRate(hits: number, total: number): string {
  if (total === 0) return '0.00%';
  return ((hits / total) * 100).toFixed(2) + '%';
}