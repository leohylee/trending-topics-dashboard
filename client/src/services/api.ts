import axios from 'axios';
import { TrendingData, ApiResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

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

  async refreshTrending(keywords: string[]): Promise<TrendingData[]> {
    const response = await api.post<ApiResponse<TrendingData[]>>('/trending/refresh', {
      keywords
    });
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to refresh trending topics');
    }
    
    return response.data.data!.map(item => ({
      ...item,
      lastUpdated: new Date(item.lastUpdated)
    }));
  },

  async getHealth(): Promise<{ status: string; timestamp: string; uptime: number; version: string }> {
    const response = await api.get<ApiResponse<any>>('/health');
    
    if (!response.data.success) {
      throw new Error('Health check failed');
    }
    
    return response.data.data;
  }
};