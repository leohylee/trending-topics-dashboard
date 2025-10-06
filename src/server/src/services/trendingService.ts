import { OpenAIService } from './openaiService';
import { CacheService } from './cacheService';
import { TrendingData, CachedTrendingResponse, SectionWithCacheRetention } from '../types';
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

    if (keywords.length > APP_LIMITS.maxKeywords) {
      throw new Error(`Maximum ${APP_LIMITS.maxKeywords} keywords allowed`);
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

  async getCachedTopics(keywords: string[]): Promise<CachedTrendingResponse> {
    if (keywords.length === 0) {
      return {
        cachedData: [],
        uncachedKeywords: [],
        totalRequested: 0,
        cacheHits: 0
      };
    }

    if (keywords.length > APP_LIMITS.maxKeywords) {
      throw new Error(`Maximum ${APP_LIMITS.maxKeywords} keywords allowed`);
    }

    const cachedData = await this.cacheService.getMultiple(keywords);
    const validCachedData: TrendingData[] = [];
    const uncachedKeywords: string[] = [];

    console.log(`🔍 Checking cache for ${keywords.length} keywords...`);

    for (const keyword of keywords) {
      const cached = cachedData.get(keyword);
      if (cached && this.isCacheValid(cached)) {
        console.log(`✅ Cache HIT for keyword: ${keyword}`);
        validCachedData.push({
          ...cached,
          cached: true
        });
      } else {
        console.log(`❌ Cache MISS for keyword: ${keyword}`);
        uncachedKeywords.push(keyword);
      }
    }

    const response: CachedTrendingResponse = {
      cachedData: validCachedData.sort((a, b) => keywords.indexOf(a.keyword) - keywords.indexOf(b.keyword)),
      uncachedKeywords,
      totalRequested: keywords.length,
      cacheHits: validCachedData.length
    };

    console.log(`📊 Cache results: ${response.cacheHits}/${response.totalRequested} hits (${Math.round(response.cacheHits / response.totalRequested * 100)}%)`);
    
    return response;
  }

  async refreshTopics(keywords: string[]): Promise<TrendingData[]> {
    if (keywords.length === 0) {
      return [];
    }

    if (keywords.length > APP_LIMITS.maxKeywords) {
      throw new Error(`Maximum ${APP_LIMITS.maxKeywords} keywords allowed`);
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
    try {
      const keywordTopics = await this.openaiService.getTrendingTopics(
        keywords,
        APP_LIMITS.maxResultsPerKeyword
      );

      return keywordTopics.map(item => ({
        keyword: item.keyword,
        topics: item.topics.slice(0, APP_LIMITS.maxResultsPerKeyword),
        lastUpdated: new Date(),
        cached: false
      }));
    } catch (error: any) {
      console.error('Error in fetchFreshData:', error);
      // If there's a timeout or API error, return fallback data
      return keywords.map(keyword => this.getFallbackData(keyword));
    }
  }

  private isCacheValid(data: TrendingData): boolean {
    const now = new Date();
    const cacheAge = now.getTime() - new Date(data.lastUpdated).getTime();
    const maxAge = APP_LIMITS.cacheDurationHours * 60 * 60 * 1000; // Convert to milliseconds
    
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

  async getTrendingTopicsWithRetention(sections: SectionWithCacheRetention[]): Promise<TrendingData[]> {
    if (sections.length === 0) {
      return [];
    }

    if (sections.length > APP_LIMITS.maxKeywords) {
      throw new Error(`Maximum ${APP_LIMITS.maxKeywords} sections allowed`);
    }

    const keywords = sections.map(s => s.keyword);
    const cachedData = await this.cacheService.getMultiple(keywords);
    const uncachedSections: SectionWithCacheRetention[] = [];
    const results: TrendingData[] = [];

    // Create a map for quick section lookup
    const sectionMap = new Map(sections.map(s => [s.keyword, s]));

    for (const section of sections) {
      const cached = cachedData.get(section.keyword);
      if (cached && this.isCacheValidWithCustomRetention(cached, section.cacheRetention)) {
        results.push(cached);
      } else {
        uncachedSections.push(section);
      }
    }

    if (uncachedSections.length > 0) {
      try {
        const uncachedKeywords = uncachedSections.map(s => s.keyword);
        const freshData = await this.fetchFreshData(uncachedKeywords);
        results.push(...freshData);
        
        // Cache with custom retention times
        const cacheMap = new Map<string, TrendingData>();
        const ttlMap = new Map<string, number>();
        
        freshData.forEach(data => {
          cacheMap.set(data.keyword, data);
          const section = sectionMap.get(data.keyword);
          if (section?.cacheRetention) {
            const ttlSeconds = this.calculateTtlSeconds(section.cacheRetention);
            ttlMap.set(data.keyword, ttlSeconds);
          }
        });
        
        await this.cacheService.setMultiple(cacheMap, ttlMap);
      } catch (error) {
        console.error('Error fetching fresh data:', error);
        
        for (const section of uncachedSections) {
          results.push(this.getFallbackData(section.keyword));
        }
      }
    }

    return results.sort((a, b) => keywords.indexOf(a.keyword) - keywords.indexOf(b.keyword));
  }

  private isCacheValidWithCustomRetention(data: TrendingData, cacheRetention?: { value: number; unit: 'hour' | 'day' }): boolean {
    const now = new Date();
    const cacheAge = now.getTime() - new Date(data.lastUpdated).getTime();
    
    let maxAge: number;
    if (cacheRetention) {
      maxAge = this.calculateTtlSeconds(cacheRetention) * 1000; // Convert to milliseconds
    } else {
      maxAge = APP_LIMITS.cacheDurationHours * 60 * 60 * 1000; // Default retention
    }
    
    return cacheAge < maxAge;
  }

  private calculateTtlSeconds(cacheRetention: { value: number; unit: 'hour' | 'day' }): number {
    const { value, unit } = cacheRetention;
    
    // Validate constraints: 1-168 hours or 1-7 days
    if (unit === 'hour') {
      const clampedValue = Math.max(1, Math.min(168, value));
      return clampedValue * 3600; // Convert hours to seconds
    } else {
      const clampedValue = Math.max(1, Math.min(7, value));
      return clampedValue * 24 * 3600; // Convert days to seconds
    }
  }

  async refreshTopicsWithRetention(sections: SectionWithCacheRetention[]): Promise<TrendingData[]> {
    if (sections.length === 0) {
      return [];
    }

    if (sections.length > APP_LIMITS.maxKeywords) {
      throw new Error(`Maximum ${APP_LIMITS.maxKeywords} sections allowed`);
    }

    try {
      const keywords = sections.map(s => s.keyword);
      const freshData = await this.fetchFreshData(keywords);
      
      // Cache with custom retention times
      const cacheMap = new Map<string, TrendingData>();
      const ttlMap = new Map<string, number>();
      
      // Create section lookup map
      const sectionMap = new Map(sections.map(s => [s.keyword, s]));
      
      freshData.forEach(data => {
        cacheMap.set(data.keyword, data);
        const section = sectionMap.get(data.keyword);
        if (section?.cacheRetention) {
          const ttlSeconds = this.calculateTtlSeconds(section.cacheRetention);
          ttlMap.set(data.keyword, ttlSeconds);
        }
      });
      
      await this.cacheService.setMultiple(cacheMap, ttlMap);
      return freshData;
    } catch (error) {
      console.error('Error refreshing topics with retention:', error);
      throw new Error('Failed to refresh trending topics');
    }
  }

  async disconnect(): Promise<void> {
    await this.cacheService.disconnect();
  }
}