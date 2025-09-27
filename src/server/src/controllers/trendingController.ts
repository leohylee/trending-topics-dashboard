import { Request, Response, NextFunction } from 'express';
import { TrendingService } from '../services/trendingService';
import { ApiResponse, TrendingRequestWithRetention } from '../types';
import { createSuccessResponse } from '../utils/api';
import { apiLogger } from '../utils/logger';

export class TrendingController {
  private trendingService: TrendingService;

  constructor() {
    this.trendingService = new TrendingService();
  }

  getTrending = async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      // Keywords validation handled by middleware
      const keywords = req.validatedKeywords!;
      
      apiLogger.apiRequest('GET', '/trending', { keywords });
      const data = await this.trendingService.getTrendingTopics(keywords);
      
      const response = createSuccessResponse(data, 'Trending topics retrieved successfully');
      apiLogger.apiResponse(200, 'Trending topics retrieved', { count: data.length });
      
      res.json(response);
    } catch (error) {
      apiLogger.error('Failed to get trending topics', error);
      next(error);
    }
  };

  getTrendingCached = async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      // Keywords validation handled by middleware
      const keywords = req.validatedKeywords!;
      
      apiLogger.apiRequest('GET', '/trending/cached', { keywords });
      const result = await this.trendingService.getCachedTopics(keywords);
      
      const response = createSuccessResponse(result, 'Cached trending topics retrieved successfully');
      apiLogger.apiResponse(200, 'Cached topics retrieved', { 
        hits: result.cacheHits, 
        total: result.totalRequested 
      });
      
      res.json(response);
    } catch (error) {
      apiLogger.error('Failed to get cached trending topics', error);
      next(error);
    }
  };

  refreshTrending = async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      // Keywords validation handled by middleware
      const keywords = req.validatedKeywords!;
      
      apiLogger.apiRequest('POST', '/trending/refresh', { keywords });
      const data = await this.trendingService.refreshTopics(keywords);
      
      const response = createSuccessResponse(data, 'Trending topics refreshed successfully');
      apiLogger.apiResponse(200, 'Trending topics refreshed', { keywords: keywords.length });
      
      res.json(response);
    } catch (error) {
      apiLogger.error('Failed to refresh trending topics', error);
      next(error);
    }
  };

  getHealth = async (_: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
      };
      
      const response = createSuccessResponse(healthData, 'Service is healthy');
      apiLogger.apiResponse(200, 'Health check successful');
      
      res.json(response);
    } catch (error) {
      apiLogger.error('Health check failed', error);
      next(error);
    }
  };

  getCacheStats = async (_: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      const stats = this.trendingService.getCacheStats();
      
      const response = createSuccessResponse(stats, 'Cache statistics retrieved successfully');
      apiLogger.apiResponse(200, 'Cache stats retrieved', { cacheType: stats.cacheType });
      
      res.json(response);
    } catch (error) {
      apiLogger.error('Failed to get cache statistics', error);
      next(error);
    }
  };

  getCacheInfo = async (_: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      const info = await this.trendingService.getCacheInfo();
      
      const response = createSuccessResponse(info, 'Cache information retrieved successfully');
      apiLogger.apiResponse(200, 'Cache info retrieved');
      
      res.json(response);
    } catch (error) {
      apiLogger.error('Failed to get cache information', error);
      next(error);
    }
  };

  clearCache = async (_: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      await this.trendingService.clearCache();
      
      const response = createSuccessResponse({ cleared: true }, 'Cache cleared successfully');
      apiLogger.apiResponse(200, 'Cache cleared');
      
      res.json(response);
    } catch (error) {
      apiLogger.error('Failed to clear cache', error);
      next(error);
    }
  };

  clearCacheByKeyword = async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      // Keyword validation handled by middleware
      const keyword = req.validatedKeyword!;
      
      apiLogger.apiRequest('DELETE', `/cache/${keyword}`);
      await this.trendingService.clearCacheByKeyword(keyword);
      
      const response = createSuccessResponse(
        { keyword, cleared: true }, 
        `Cache cleared for keyword: ${keyword}`
      );
      apiLogger.apiResponse(200, 'Cache cleared by keyword', { keyword });
      
      res.json(response);
    } catch (error) {
      apiLogger.error('Failed to clear cache by keyword', error);
      next(error);
    }
  };

  getTrendingWithRetention = async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      const requestBody: TrendingRequestWithRetention = req.body;
      
      if (!requestBody.sections || !Array.isArray(requestBody.sections)) {
        res.status(400).json({
          success: false,
          error: 'Invalid request body: sections array is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      apiLogger.apiRequest('POST', '/trending/with-retention', { sectionsCount: requestBody.sections.length });
      const data = await this.trendingService.getTrendingTopicsWithRetention(requestBody.sections);
      
      const response = createSuccessResponse(data, 'Trending topics retrieved with custom retention');
      apiLogger.apiResponse(200, 'Trending topics retrieved with retention', { count: data.length });
      
      res.json(response);
    } catch (error) {
      apiLogger.error('Failed to get trending topics with retention', error);
      next(error);
    }
  };

  refreshTrendingWithRetention = async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      const requestBody: TrendingRequestWithRetention = req.body;
      
      if (!requestBody.sections || !Array.isArray(requestBody.sections)) {
        res.status(400).json({
          success: false,
          error: 'Invalid request body: sections array is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      apiLogger.apiRequest('POST', '/trending/refresh-with-retention', { sectionsCount: requestBody.sections.length });
      const data = await this.trendingService.refreshTopicsWithRetention(requestBody.sections);
      
      const response = createSuccessResponse(data, 'Trending topics refreshed with custom retention');
      apiLogger.apiResponse(200, 'Trending topics refreshed with retention', { count: data.length });
      
      res.json(response);
    } catch (error) {
      apiLogger.error('Failed to refresh trending topics with retention', error);
      next(error);
    }
  };
}