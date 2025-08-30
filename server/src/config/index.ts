import dotenv from 'dotenv';
import sharedConfig from '../../../config/shared-config.json';

dotenv.config();

export const APP_LIMITS = sharedConfig.APP_LIMITS;

export const config = {
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  
  // OpenAI Configuration
  openai: {
    // Model selection: 'gpt-4-turbo' for best quality, 'gpt-3.5-turbo' for cost efficiency
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '3000'),
    presencePenalty: parseFloat(process.env.OPENAI_PRESENCE_PENALTY || '0.1'),
    frequencyPenalty: parseFloat(process.env.OPENAI_FREQUENCY_PENALTY || '0.1'),
    // Web Search Configuration
    webSearch: {
      enabled: process.env.OPENAI_WEB_SEARCH_ENABLED !== 'false', // Default enabled
      contextSize: process.env.OPENAI_WEB_SEARCH_CONTEXT_SIZE || 'medium' // high, medium, low
    }
  }
};

export const validateConfig = () => {
  if (!config.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }
};