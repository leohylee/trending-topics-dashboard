import { Router } from 'express';
import { TrendingController } from '../controllers/trendingController';
import { rateLimitRefresh } from '../middleware/rateLimiter';
import { validateKeywordsQuery, validateKeywordsBody, validateKeywordParam } from '../middleware/validation';

export const createTrendingRoutes = (): Router => {
  const router = Router();
  const controller = new TrendingController();

  router.get('/trending', validateKeywordsQuery, controller.getTrending);
  router.get('/trending/cached', validateKeywordsQuery, controller.getTrendingCached);
  router.post('/trending/refresh', rateLimitRefresh, validateKeywordsBody, controller.refreshTrending);
  router.get('/health', controller.getHealth);
  router.get('/cache/stats', controller.getCacheStats);
  router.get('/cache/info', controller.getCacheInfo);
  router.delete('/cache', controller.clearCache);
  router.delete('/cache/:keyword', validateKeywordParam, controller.clearCacheByKeyword);

  return router;
};