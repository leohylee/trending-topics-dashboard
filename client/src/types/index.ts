// Re-export shared types for use in client
export type {
  Section,
  TrendingTopic,
  TrendingData,
  ApiResponse,
  ApiError
} from '../../../shared/types';
import baseConfig from '../../../config/base.json';
import type { Section } from '../../../shared/types';

// Client-specific types
export interface DashboardSettings {
  sections: Section[];
}

// Export app limits from base config
export const APP_LIMITS = baseConfig.limits;