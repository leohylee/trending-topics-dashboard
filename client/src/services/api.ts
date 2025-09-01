import axios, { AxiosError } from 'axios';
import { TrendingData, ApiResponse, HealthResponse, CacheStatsResponse, CacheInfoResponse, RefreshRequest, CachedTrendingResponse, Section } from '../types';
import { transformDatesInResponse, handleApiError } from '../../../shared/utils/api';
import { API_CONFIG } from '../config';

// Create axios instance with configuration from centralized config
const api = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging (development only)
api.interceptors.request.use(
  (config) => {
    // Only log in development
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.error('API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    const apiError = handleApiError(error);
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.error('API Response Error:', apiError.message);
    }
    return Promise.reject(apiError);
  }
);

// Helper function to process API response data
function processResponseData<T>(data: T): T {
  return transformDatesInResponse(data) as T;
}

export const trendingApi = {
  async getTrending(keywords: string[]): Promise<TrendingData[]> {
    const keywordsParam = keywords.join(',');
    const response = await api.get<ApiResponse<TrendingData[]>>(`/trending?keywords=${encodeURIComponent(keywordsParam)}`);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch trending topics');
    }
    
    return processResponseData(response.data.data!);
  },

  async getCachedTrending(keywords: string[]): Promise<CachedTrendingResponse> {
    const keywordsParam = keywords.join(',');
    const response = await api.get<ApiResponse<CachedTrendingResponse>>(`/trending/cached?keywords=${encodeURIComponent(keywordsParam)}`);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch cached trending topics');
    }
    
    return processResponseData(response.data.data!);
  },

  async refreshTrending(keywords: string[]): Promise<TrendingData[]> {
    const payload: RefreshRequest = { keywords };
    const response = await api.post<ApiResponse<TrendingData[]>>('/trending/refresh', payload);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to refresh trending topics');
    }
    
    return processResponseData(response.data.data!);
  },

  async refreshSingleKeyword(keyword: string): Promise<TrendingData> {
    const payload: RefreshRequest = { keywords: [keyword] };
    const response = await api.post<ApiResponse<TrendingData[]>>('/trending/refresh', payload);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to refresh trending topic');
    }
    
    const result = response.data.data![0];
    return processResponseData(result);
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
  },

  async getTrendingWithRetention(sections: Section[]): Promise<TrendingData[]> {
    const payload = {
      sections: sections.map(section => ({
        keyword: section.keyword,
        maxResults: section.maxResults,
        cacheRetention: section.cacheRetention
      }))
    };
    
    const response = await api.post<ApiResponse<TrendingData[]>>('/trending/with-retention', payload);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch trending topics with retention');
    }
    
    return processResponseData(response.data.data!);
  },

  async refreshTrendingWithRetention(sections: Section[]): Promise<TrendingData[]> {
    const payload = {
      sections: sections.map(section => ({
        keyword: section.keyword,
        maxResults: section.maxResults,
        cacheRetention: section.cacheRetention
      }))
    };
    
    const response = await api.post<ApiResponse<TrendingData[]>>('/trending/refresh-with-retention', payload);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to refresh trending topics with retention');
    }
    
    return processResponseData(response.data.data!);
  },

  async refreshSingleSectionWithRetention(section: Section): Promise<TrendingData> {
    const payload = {
      sections: [{
        keyword: section.keyword,
        maxResults: section.maxResults,
        cacheRetention: section.cacheRetention
      }]
    };
    
    const response = await api.post<ApiResponse<TrendingData[]>>('/trending/refresh-with-retention', payload);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to refresh trending topic with retention');
    }
    
    const result = response.data.data![0];
    return processResponseData(result);
  }
};

// Export shared utilities for use in components
export { handleApiError } from '../../../shared/utils/api';

// Export axios instance for advanced usage
export { api };