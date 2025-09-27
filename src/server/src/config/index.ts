import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

// Load base config with runtime path resolution
const getBaseConfig = () => {
  // Try Lambda environment path first (from /var/task/dist/config to /var/task/config)
  const lambdaConfigPath = join(__dirname, '../../config/base.json');
  // Fallback to development environment path
  const devConfigPath = join(__dirname, '../../../../config/base.json');
  
  try {
    return JSON.parse(readFileSync(lambdaConfigPath, 'utf8'));
  } catch {
    try {
      return JSON.parse(readFileSync(devConfigPath, 'utf8'));
    } catch (error) {
      throw new Error(`Cannot find base.json config file. Tried: ${lambdaConfigPath}, ${devConfigPath}`);
    }
  }
};

const baseConfig = getBaseConfig();

// Server configuration combining base config with environment variables
export const config = {
  port: parseInt(process.env.PORT || baseConfig.ports.server.toString()),
  nodeEnv: process.env.NODE_ENV || 'development',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  redisUrl: process.env.REDIS_URL || baseConfig.cache.redis.url,
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || baseConfig.cors.origins,
  
  // OpenAI Configuration from base config with env overrides
  openai: {
    model: process.env.OPENAI_MODEL || baseConfig.openai.model,
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || baseConfig.openai.temperature.toString()),
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || baseConfig.openai.maxTokens.toString()),
    presencePenalty: parseFloat(process.env.OPENAI_PRESENCE_PENALTY || baseConfig.openai.presencePenalty.toString()),
    frequencyPenalty: parseFloat(process.env.OPENAI_FREQUENCY_PENALTY || baseConfig.openai.frequencyPenalty.toString()),
    webSearch: {
      enabled: process.env.OPENAI_WEB_SEARCH_ENABLED !== 'false',
      contextSize: process.env.OPENAI_WEB_SEARCH_CONTEXT_SIZE || baseConfig.openai.webSearch.contextSize
    }
  }
};

// Legacy exports for backwards compatibility
export const APP_LIMITS = baseConfig.limits;

export const validateConfig = () => {
  if (!config.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }
  
  // Validate ranges
  if (config.openai.temperature < 0 || config.openai.temperature > 2) {
    throw new Error('OPENAI_TEMPERATURE must be between 0 and 2');
  }
  
  if (APP_LIMITS.maxKeywords < 1 || APP_LIMITS.maxKeywords > 50) {
    throw new Error('maxKeywords must be between 1 and 50');
  }
};