import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateConfig } from './config';
import { createTrendingRoutes } from './routes/trending';
import { errorHandler } from './middleware/errorHandler';

async function startServer() {
  try {
    validateConfig();
    
    const app = express();
    
    app.use(helmet());
    app.use(cors({
      origin: config.corsOrigins,
      credentials: true
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    app.use('/api', createTrendingRoutes());
    
    app.get('/', (_, res) => {
      res.json({
        message: 'Trending Topics Dashboard API',
        version: '1.0.0',
        status: 'running'
      });
    });

    app.use('*', (_, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        message: 'The requested endpoint does not exist'
      });
    });

    app.use(errorHandler);

    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/api/health`);
    });

    const gracefulShutdown = () => {
      console.log('📴 Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();