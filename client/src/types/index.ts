import sharedConfig from '../../../config/shared-config.json';

export interface Section {
  id: string;
  keyword: string;
  maxResults: number;
  position: { x: number; y: number; w: number; h: number };
}

export interface TrendingTopic {
  title: string;
  summary: string;
  searchUrl: string;
}

export interface TrendingData {
  keyword: string;
  topics: TrendingTopic[];
  lastUpdated: Date;
  cached: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardSettings {
  sections: Section[];
}

// API Response Types
export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
}

export interface CacheStatsResponse {
  hits: number;
  misses: number;
  errors: number;
  hitRate: string;
  cacheType: string;
}

export interface CacheInfoResponse {
  cacheType: string;
  totalKeys: number;
  keys: Array<{
    keyword: string;
    expiresIn: string;
    key: string;
  }>;
}

export interface CachedTrendingResponse {
  cachedData: TrendingData[];
  uncachedKeywords: string[];
  totalRequested: number;
  cacheHits: number;
}

// Request Types
export interface RefreshRequest {
  keywords: string[];
}

// Error Types
export interface ApiError extends Error {
  status?: number;
  code?: string;
}

export const APP_LIMITS = sharedConfig.APP_LIMITS;