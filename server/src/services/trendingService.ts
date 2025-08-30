import { OpenAIService } from './openaiService';
import { CacheService } from './cacheService';
import { TrendingData } from '../types';
import { APP_LIMITS } from '../config';

export class TrendingService {
  private openaiService: OpenAIService;
  private cacheService: CacheService;

  constructor() {
    this.openaiService = new OpenAIService();
    this.cacheService = new CacheService();
  }

  async getTrendingTopics(keywords: string[]): Promise<TrendingData[]> {
    if (keywords.length === 0) {
      return [];
    }

    if (keywords.length > APP_LIMITS.MAX_KEYWORDS) {
      throw new Error(`Maximum ${APP_LIMITS.MAX_KEYWORDS} keywords allowed`);
    }

    const cachedData = await this.cacheService.getMultiple(keywords);
    const uncachedKeywords: string[] = [];
    const results: TrendingData[] = [];

    for (const keyword of keywords) {
      const cached = cachedData.get(keyword);
      if (cached && this.isCacheValid(cached)) {
        results.push(cached);
      } else {
        uncachedKeywords.push(keyword);
      }
    }

    if (uncachedKeywords.length > 0) {
      try {
        const freshData = await this.fetchFreshData(uncachedKeywords);
        results.push(...freshData);
        
        const cacheMap = new Map<string, TrendingData>();
        freshData.forEach(data => {
          cacheMap.set(data.keyword, data);
        });
        
        await this.cacheService.setMultiple(cacheMap);
      } catch (error) {
        console.error('Error fetching fresh data:', error);
        
        for (const keyword of uncachedKeywords) {
          results.push(this.getFallbackData(keyword));
        }
      }
    }

    return results.sort((a, b) => keywords.indexOf(a.keyword) - keywords.indexOf(b.keyword));
  }

  async refreshTopics(keywords: string[]): Promise<TrendingData[]> {
    if (keywords.length === 0) {
      return [];
    }

    if (keywords.length > APP_LIMITS.MAX_KEYWORDS) {
      throw new Error(`Maximum ${APP_LIMITS.MAX_KEYWORDS} keywords allowed`);
    }

    try {
      const freshData = await this.fetchFreshData(keywords);
      
      const cacheMap = new Map<string, TrendingData>();
      freshData.forEach(data => {
        cacheMap.set(data.keyword, data);
      });
      
      await this.cacheService.setMultiple(cacheMap);
      return freshData;
    } catch (error) {
      console.error('Error refreshing topics:', error);
      throw new Error('Failed to refresh trending topics');
    }
  }

  private async fetchFreshData(keywords: string[]): Promise<TrendingData[]> {
    const keywordTopics = await this.openaiService.getTrendingTopics(
      keywords,
      APP_LIMITS.MAX_RESULTS_PER_KEYWORD
    );

    return keywordTopics.map(item => ({
      keyword: item.keyword,
      topics: item.topics.slice(0, APP_LIMITS.MAX_RESULTS_PER_KEYWORD),
      lastUpdated: new Date(),
      cached: false
    }));
  }

  private isCacheValid(data: TrendingData): boolean {
    const now = new Date();
    const cacheAge = now.getTime() - new Date(data.lastUpdated).getTime();
    const maxAge = APP_LIMITS.CACHE_DURATION_HOURS * 60 * 60 * 1000; // Convert to milliseconds
    
    return cacheAge < maxAge;
  }

  private getFallbackData(keyword: string): TrendingData {
    return {
      keyword,
      topics: [
        {
          title: `${keyword} Topics Unavailable`,
          summary: 'Unable to fetch trending topics at this time. Please try again later.',
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword)}`
        }
      ],
      lastUpdated: new Date(),
      cached: false
    };
  }

  getCacheStats() {
    return this.cacheService.getStats();
  }

  async getCacheInfo() {
    return await this.cacheService.getCacheInfo();
  }

  async clearCache(): Promise<void> {
    await this.cacheService.clear();
    console.log('🗑️ Cache cleared successfully');
  }

  async clearCacheByKeyword(keyword: string): Promise<void> {
    await this.cacheService.delete(keyword);
    console.log(`🗑️ Cache cleared for keyword: ${keyword}`);
  }

  async disconnect(): Promise<void> {
    await this.cacheService.disconnect();
  }
}