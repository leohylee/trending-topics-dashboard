// Server-specific types
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
  sourceUrl?: string; // Actual URL from web search results
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
  code?: string;
  timestamp?: string;
}

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

export interface RefreshRequest {
  keywords: string[];
}

export interface SectionCacheRetention {
  value: number;
  unit: 'hour' | 'day';
}

export interface SectionWithCacheRetention {
  keyword: string;
  maxResults: number;
  cacheRetention?: SectionCacheRetention;
}

export interface TrendingRequestWithRetention {
  sections: SectionWithCacheRetention[];
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  timestamp?: string;
}

export type ErrorCode = string;

export interface KeywordTopics {
  keyword: string;
  topics: TrendingTopic[];
}

// Server-specific utility types
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  code?: string;
}