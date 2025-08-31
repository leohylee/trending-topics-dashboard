import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';
import { APP_LIMITS } from '../config';
import { ApiResponse } from '../types';

const refreshCache = new NodeCache({ stdTTL: 86400 }); // 24 hours

export const rateLimitRefresh = (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  if (!APP_LIMITS.manualRefreshEnabled) {
    return next();
  }

  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const today = new Date().toDateString();
  const key = `refresh_${clientIp}_${today}`;
  
  const currentCount = refreshCache.get<number>(key) || 0;
  
  if (currentCount >= APP_LIMITS.manualRefreshLimit) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: `Maximum ${APP_LIMITS.manualRefreshLimit} manual refreshes per day allowed`
    });
  }
  
  refreshCache.set(key, currentCount + 1);
  next();
};