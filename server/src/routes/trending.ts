import { Router } from 'express';
import { TrendingController } from '../controllers/trendingController';
import { rateLimitRefresh } from '../middleware/rateLimiter';

export const createTrendingRoutes = (): Router => {
  const router = Router();
  const controller = new TrendingController();

  router.get('/trending', controller.getTrending);
  router.post('/trending/refresh', rateLimitRefresh, controller.refreshTrending);
  router.get('/health', controller.getHealth);
  router.get('/cache/stats', controller.getCacheStats);
  router.get('/cache/info', controller.getCacheInfo);

  return router;
};