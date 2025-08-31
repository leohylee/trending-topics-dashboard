import baseConfig from '../../config/base.json';
import envSchema from '../../config/environment.schema.json';

export interface AppConfig {
  app: {
    name: string;
    version: string;
  };
  ports: {
    server: number;
    client: number;
  };
  api: {
    timeout: number;
    baseUrl: string;
  };
  cors: {
    origins: string[];
  };
  limits: {
    maxKeywords: number;
    manualRefreshLimit: number;
    cacheDurationHours: number;
    manualRefreshEnabled: boolean;
    maxResultsPerKeyword: number;
    minResultsPerKeyword: number;
  };
  openai: {
    apiKey?: string;
    model: string;
    temperature: number;
    maxTokens: number;
    presencePenalty: number;
    frequencyPenalty: number;
    webSearch: {
      enabled: boolean;
      contextSize: string;
    };
  };
  cache: {
    redis: {
      url: string;
    };
    node: {
      stdTTL: number;
      checkPeriod: number;
    };
  };
  server?: {
    port: number;
    nodeEnv: string;
    redisUrl: string;
    corsOrigins: string[];
  };
}

class ConfigManager {
  private config: AppConfig;
  
  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    // Start with base config
    const config: AppConfig = {
      ...baseConfig,
      openai: {
        ...baseConfig.openai,
        apiKey: undefined // Will be loaded from env
      }
    };

    // In server environment, load from environment variables
    if (typeof process !== 'undefined' && process.env) {
      this.loadEnvironmentVariables(config);
      this.validateConfiguration(config);
    }

    return config;
  }

  private loadEnvironmentVariables(config: AppConfig): void {
    // Required environment variables
    config.openai.apiKey = process.env.OPENAI_API_KEY;

    // Optional environment variables with fallbacks
    config.server = {
      port: parseInt(process.env.PORT || config.ports.server.toString()),
      nodeEnv: process.env.NODE_ENV || 'development',
      redisUrl: process.env.REDIS_URL || config.cache.redis.url,
      corsOrigins: process.env.CORS_ORIGINS?.split(',') || config.cors.origins
    };

    // OpenAI overrides
    if (process.env.OPENAI_MODEL) {
      config.openai.model = process.env.OPENAI_MODEL;
    }
    if (process.env.OPENAI_TEMPERATURE) {
      config.openai.temperature = parseFloat(process.env.OPENAI_TEMPERATURE);
    }
    if (process.env.OPENAI_MAX_TOKENS) {
      config.openai.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS);
    }
    if (process.env.OPENAI_PRESENCE_PENALTY) {
      config.openai.presencePenalty = parseFloat(process.env.OPENAI_PRESENCE_PENALTY);
    }
    if (process.env.OPENAI_FREQUENCY_PENALTY) {
      config.openai.frequencyPenalty = parseFloat(process.env.OPENAI_FREQUENCY_PENALTY);
    }
    if (process.env.OPENAI_WEB_SEARCH_ENABLED !== undefined) {
      config.openai.webSearch.enabled = process.env.OPENAI_WEB_SEARCH_ENABLED !== 'false';
    }
    if (process.env.OPENAI_WEB_SEARCH_CONTEXT_SIZE) {
      config.openai.webSearch.contextSize = process.env.OPENAI_WEB_SEARCH_CONTEXT_SIZE;
    }
  }

  private validateConfiguration(config: AppConfig): void {
    const errors: string[] = [];

    // Validate required environment variables
    if (!config.openai.apiKey) {
      errors.push('OPENAI_API_KEY is required');
    }

    // Validate ranges
    if (config.openai.temperature < 0 || config.openai.temperature > 2) {
      errors.push('OPENAI_TEMPERATURE must be between 0 and 2');
    }

    if (config.limits.maxKeywords < 1 || config.limits.maxKeywords > 50) {
      errors.push('MAX_KEYWORDS must be between 1 and 50');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public getServerConfig() {
    if (!this.config.server) {
      throw new Error('Server configuration not available in client environment');
    }
    return this.config.server;
  }

  // Convenience getters
  public get limits() {
    return this.config.limits;
  }

  public get ports() {
    return this.config.ports;
  }

  public get openai() {
    return this.config.openai;
  }

  public get cache() {
    return this.config.cache;
  }
}

// Export singleton instance
export const configManager = new ConfigManager();
export const config = configManager.getConfig();

// Legacy exports for backwards compatibility
export const APP_LIMITS = config.limits;
export const AppLimits = config.limits;