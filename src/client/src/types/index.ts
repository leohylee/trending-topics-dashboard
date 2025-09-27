// Shared types (local definitions)
export interface TrendingTopic {
  title: string;
  summary: string;
  searchUrl: string;
}

export interface TrendingData {
  keyword: string;
  topics: TrendingTopic[];
  lastUpdated: string;
  cached: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface Section {
  id: string;
  keyword: string;
  maxResults: number;
  cacheRetention: {
    value: number;
    unit: 'hour' | 'day';
  };
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

// Client-specific types
export interface DashboardSettings {
  sections: Section[];
}

// Import app limits from base config
import baseConfig from '../config/base';

export const APP_LIMITS = baseConfig.limits;