// Shared type definitions for both client and server
// This file eliminates type duplication between frontend and backend

// Core domain interfaces
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

// Section interface - using flexible position for client/server compatibility
export interface Section {
  id: string;
  keyword: string;
  maxResults: number;
  position: {
    x: number;
    y: number;
    w?: number; // Optional for client grid layout
    h?: number; // Optional for client grid layout
  };
  createdAt?: Date;
}

// API communication interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
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

// Health and monitoring interfaces
export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
  webSearchEnabled?: boolean;
  cacheType?: string;
}

export interface CacheStatsResponse {
  hits: number;
  misses: number;
  errors: number;
  hitRate: string;
  cacheType: string;
  totalRequests?: number;
}

export interface CacheInfoResponse {
  cacheType: string;
  totalKeys: number;
  keys: Array<{
    keyword: string;
    expiresIn: string;
    key: string;
    topicsCount?: number;
  }>;
}

// Configuration interfaces
export interface AppLimits {
  MAX_KEYWORDS: number;
  MANUAL_REFRESH_LIMIT: number;
  CACHE_DURATION_HOURS: number;
  MANUAL_REFRESH_ENABLED: boolean;
  MAX_RESULTS_PER_KEYWORD: number;
  MIN_RESULTS_PER_KEYWORD: number;
}

// Error interfaces
export interface ApiError extends Error {
  status?: number;
  code?: string;
  timestamp?: string;
}

// Dashboard-specific interfaces (primarily for frontend)
export interface DashboardSettings {
  sections: Section[];
}

// Cache-related interfaces
export interface CachedResult {
  keyword: string;
  topics: TrendingTopic[];
  lastUpdated: Date;
  expiresAt: Date;
}

// OpenAI service interfaces
export interface KeywordTopics {
  keyword: string;
  topics: TrendingTopic[];
}

// Utility type for consistent error responses
export type ErrorCode = 
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_KEYWORDS'
  | 'WEB_SEARCH_FAILED'
  | 'CACHE_ERROR'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'PARSING_ERROR';