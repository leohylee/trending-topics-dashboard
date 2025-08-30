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

export const APP_LIMITS = sharedConfig.APP_LIMITS;