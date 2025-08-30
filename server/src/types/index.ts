export interface Section {
  id: string;
  keyword: string;
  maxResults: number;
  position: { x: number; y: number };
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

export interface RefreshRequest {
  keywords: string[];
}

export interface CachedTrendingResponse {
  cachedData: TrendingData[];
  uncachedKeywords: string[];
  totalRequested: number;
  cacheHits: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}