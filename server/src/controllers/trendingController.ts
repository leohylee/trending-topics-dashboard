import { Request, Response, NextFunction } from 'express';
import { TrendingService } from '../services/trendingService';
import { ApiResponse, RefreshRequest } from '../types';

export class TrendingController {
  private trendingService: TrendingService;

  constructor() {
    this.trendingService = new TrendingService();
  }

  getTrending = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const keywords = req.query.keywords as string;
      
      if (!keywords) {
        return res.status(400).json({
          success: false,
          error: 'Keywords parameter is required'
        });
      }

      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      
      if (keywordArray.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one valid keyword is required'
        });
      }

      const data = await this.trendingService.getTrendingTopics(keywordArray);
      
      res.json({
        success: true,
        data,
        message: 'Trending topics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  refreshTrending = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const { keywords } = req.body as RefreshRequest;
      
      if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Keywords array is required'
        });
      }

      const cleanKeywords = keywords.map(k => k.trim()).filter(k => k.length > 0);
      
      if (cleanKeywords.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one valid keyword is required'
        });
      }

      const data = await this.trendingService.refreshTopics(cleanKeywords);
      
      res.json({
        success: true,
        data,
        message: 'Trending topics refreshed successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getHealth = async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      res.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: '1.0.0'
        },
        message: 'Service is healthy'
      });
    } catch (error) {
      next(error);
    }
  };
}