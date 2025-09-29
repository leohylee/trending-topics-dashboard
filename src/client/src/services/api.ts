import axios, { AxiosError } from 'axios';
import { TrendingData, ApiResponse, Section } from '../types';
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
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.error('API Response Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Helper function to process API response data
function processResponseData<T>(data: T): T {
  // Simple passthrough since we don't have date transformation
  return data;
}

export const trendingApi = {
  async getTrendingWithRetention(sections: Section[]): Promise<TrendingData[]> {
    // Use the basic trending endpoint since cache retention endpoints aren't deployed
    const keywords = sections.map(section => section.keyword);
    const response = await api.get<ApiResponse<TrendingData[]>>('/trending', {
      params: { keywords: keywords.join(',') }
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch trending topics');
    }

    return processResponseData(response.data.data || []);
  },

  async refreshTrendingWithRetention(sections: Section[]): Promise<TrendingData[]> {
    // Use the basic refresh endpoint since cache retention endpoints aren't deployed
    const keywords = sections.map(section => section.keyword);
    const response = await api.post<ApiResponse<TrendingData[]>>('/trending/refresh', {
      keywords: keywords
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to refresh trending topics');
    }

    return processResponseData(response.data.data || []);
  },

  async refreshSingleSectionWithRetention(section: Section): Promise<TrendingData> {
    // Use the basic refresh endpoint for single section
    const response = await api.post<ApiResponse<TrendingData[]>>('/trending/refresh', {
      keywords: [section.keyword]
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to refresh section');
    }

    const result = response.data.data?.[0];
    if (!result) {
      throw new Error('No data returned for section');
    }
    return processResponseData(result);
  }
};

// Export axios instance for advanced usage
export { api };