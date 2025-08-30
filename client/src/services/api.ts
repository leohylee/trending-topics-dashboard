import axios, { AxiosError } from 'axios';
import { TrendingData, ApiResponse, HealthResponse, CacheStatsResponse, CacheInfoResponse, RefreshRequest, CachedTrendingResponse } from '../types';

// Create axios instance with configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    const message = getErrorMessage(error);
    console.error('API Response Error:', message);
    return Promise.reject(new Error(message));
  }
);

// Error handling utility
function getErrorMessage(error: AxiosError): string {
  if (!error.response) {
    return 'Network error - please check your connection';
  }

  const status = error.response.status;
  const data = error.response.data as ApiResponse;

  if (data?.error) {
    return data.error;
  }

  switch (status) {
    case 400:
      return 'Invalid request';
    case 401:
      return 'Unauthorized access';
    case 403:
      return 'Access forbidden';
    case 404:
      return 'Resource not found';
    case 429:
      return 'Too many requests - please try again later';
    case 500:
      return 'Internal server error';
    case 503:
      return 'Service temporarily unavailable';
    default:
      return `Request failed with status ${status}`;
  }
}

export const trendingApi = {
  async getTrending(keywords: string[]): Promise<TrendingData[]> {
    const keywordsParam = keywords.join(',');
    const response = await api.get<ApiResponse<TrendingData[]>>(`/trending?keywords=${encodeURIComponent(keywordsParam)}`);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch trending topics');
    }
    
    return response.data.data!.map(item => ({
      ...item,
      lastUpdated: new Date(item.lastUpdated)
    }));
  },

  async getCachedTrending(keywords: string[]): Promise<CachedTrendingResponse> {
    const keywordsParam = keywords.join(',');
    const response = await api.get<ApiResponse<CachedTrendingResponse>>(`/trending/cached?keywords=${encodeURIComponent(keywordsParam)}`);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch cached trending topics');
    }
    
    const result = response.data.data!;
    return {
      ...result,
      cachedData: result.cachedData.map(item => ({
        ...item,
        lastUpdated: new Date(item.lastUpdated)
      }))
    };
  },

  async refreshTrending(keywords: string[]): Promise<TrendingData[]> {
    const payload: RefreshRequest = { keywords };
    const response = await api.post<ApiResponse<TrendingData[]>>('/trending/refresh', payload);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to refresh trending topics');
    }
    
    return response.data.data!.map(item => ({
      ...item,
      lastUpdated: new Date(item.lastUpdated)
    }));
  },

  async refreshSingleKeyword(keyword: string): Promise<TrendingData> {
    const payload: RefreshRequest = { keywords: [keyword] };
    const response = await api.post<ApiResponse<TrendingData[]>>('/trending/refresh', payload);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to refresh trending topic');
    }
    
    const result = response.data.data![0];
    return {
      ...result,
      lastUpdated: new Date(result.lastUpdated)
    };
  },

  async getHealth(): Promise<HealthResponse> {
    const response = await api.get<ApiResponse<HealthResponse>>('/health');
    
    if (!response.data.success) {
      throw new Error('Health check failed');
    }
    
    return response.data.data!;
  },

  async getCacheStats(): Promise<CacheStatsResponse> {
    const response = await api.get<ApiResponse<CacheStatsResponse>>('/cache/stats');
    
    if (!response.data.success) {
      throw new Error('Failed to fetch cache stats');
    }
    
    return response.data.data!;
  },

  async getCacheInfo(): Promise<CacheInfoResponse> {
    const response = await api.get<ApiResponse<CacheInfoResponse>>('/cache/info');
    
    if (!response.data.success) {
      throw new Error('Failed to fetch cache info');
    }
    
    return response.data.data!;
  }
};

// Export error handling utility for use in components
export { getErrorMessage };

// Export axios instance for advanced usage
export { api };