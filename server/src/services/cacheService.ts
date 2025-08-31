import NodeCache from 'node-cache';
import { createClient, RedisClientType } from 'redis';
import { config, APP_LIMITS } from '../config';
import { TrendingData } from '../types';

export class CacheService {
  private nodeCache: NodeCache;
  private redisClient: RedisClientType | null = null;
  private useRedis: boolean = false;
  private stats = {
    hits: 0,
    misses: 0,
    errors: 0
  };

  constructor() {
    this.nodeCache = new NodeCache({ 
      stdTTL: APP_LIMITS.cacheDurationHours * 3600,
      checkperiod: 600 // Check for expired keys every 10 minutes
    });
    
    this.initializeRedis();
  }

  private async initializeRedis() {
    if (config.nodeEnv === 'production') {
      try {
        this.redisClient = createClient({ url: config.redisUrl });
        this.redisClient.on('error', (err) => {
          console.warn('Redis Client Error:', err);
          this.useRedis = false;
        });
        
        await this.redisClient.connect();
        this.useRedis = true;
        console.log('Connected to Redis');
      } catch (error) {
        console.warn('Failed to connect to Redis, using node-cache:', error);
        this.useRedis = false;
      }
    }
  }

  async get(keyword: string): Promise<TrendingData | null> {
    const key = this.getCacheKey(keyword);
    
    try {
      if (this.useRedis && this.redisClient) {
        const cached = await this.redisClient.get(key);
        if (cached) {
          this.stats.hits++;
          const data = JSON.parse(cached);
          data.lastUpdated = new Date(data.lastUpdated);
          return data;
        }
      } else {
        const cached = this.nodeCache.get<TrendingData>(key);
        if (cached) {
          this.stats.hits++;
          return cached;
        }
      }
      this.stats.misses++;
    } catch (error) {
      this.stats.errors++;
      console.error('Cache get error:', error);
    }
    
    return null;
  }

  async set(keyword: string, data: TrendingData): Promise<void> {
    const key = this.getCacheKey(keyword);
    const cacheData = { ...data, cached: true };
    
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.setEx(
          key,
          APP_LIMITS.cacheDurationHours * 3600,
          JSON.stringify(cacheData)
        );
      } else {
        this.nodeCache.set(key, cacheData);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async getMultiple(keywords: string[]): Promise<Map<string, TrendingData>> {
    const results = new Map<string, TrendingData>();
    
    for (const keyword of keywords) {
      const data = await this.get(keyword);
      if (data) {
        results.set(keyword, data);
      }
    }
    
    return results;
  }

  async setMultiple(dataMap: Map<string, TrendingData>): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const [keyword, data] of dataMap) {
      promises.push(this.set(keyword, data));
    }
    
    await Promise.all(promises);
  }

  async delete(keyword: string): Promise<void> {
    const key = this.getCacheKey(keyword);
    
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.del(key);
      } else {
        this.nodeCache.del(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      if (this.useRedis && this.redisClient) {
        const keys = await this.redisClient.keys('trending:*');
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      } else {
        this.nodeCache.flushAll();
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  private getCacheKey(keyword: string): string {
    return `trending:${keyword.toLowerCase().replace(/\s+/g, '_')}`;
  }

  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) 
      : '0';
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      cacheType: this.useRedis ? 'Redis' : 'NodeCache'
    };
  }

  resetStats() {
    this.stats = { hits: 0, misses: 0, errors: 0 };
  }

  async getCacheInfo() {
    try {
      if (this.useRedis && this.redisClient) {
        const keys = await this.redisClient.keys('trending:*');
        const cacheInfo = [];
        
        for (const key of keys) {
          const ttl = await this.redisClient.ttl(key);
          const keyword = key.replace('trending:', '').replace(/_/g, ' ');
          cacheInfo.push({
            keyword,
            expiresIn: ttl > 0 ? `${Math.floor(ttl / 60)} minutes` : 'expired',
            key
          });
        }
        
        return {
          cacheType: 'Redis',
          totalKeys: keys.length,
          keys: cacheInfo
        };
      } else {
        const keys = this.nodeCache.keys();
        const cacheInfo = keys.map(key => {
          const ttl = this.nodeCache.getTtl(key);
          const keyword = key.replace('trending:', '').replace(/_/g, ' ');
          const now = Date.now();
          const expiresIn = ttl ? Math.floor((ttl - now) / 60000) : 0;
          
          return {
            keyword,
            expiresIn: expiresIn > 0 ? `${expiresIn} minutes` : 'expired',
            key
          };
        });
        
        return {
          cacheType: 'NodeCache',
          totalKeys: keys.length,
          keys: cacheInfo
        };
      }
    } catch (error) {
      console.error('Error getting cache info:', error);
      return {
        cacheType: this.useRedis ? 'Redis' : 'NodeCache',
        totalKeys: 0,
        keys: [],
        error: 'Failed to retrieve cache information'
      };
    }
  }

  async disconnect(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.disconnect();
    }
  }
}