# Configuration Management

This directory contains the centralized configuration system for the Trending Topics Dashboard.

## Structure

```
config/
├── base.json                    # Base configuration shared across environments
├── environment.schema.json      # Environment variable schema
└── README.md                   # This file

shared/config/
└── index.ts                    # Advanced config manager (currently unused due to TypeScript constraints)
```

## Files

### `base.json`
Contains all shared configuration that doesn't contain sensitive information:
- Application metadata
- Port configurations  
- API settings
- CORS origins
- Application limits
- OpenAI default settings (without API key)
- Cache configuration

### `environment.schema.json`
Documents required and optional environment variables for validation.

## Usage

### Server (TypeScript)
```typescript
import { config, APP_LIMITS, validateConfig } from './config';

// Validates and loads config from base.json + environment variables
validateConfig();

console.log(`Server running on port ${config.port}`);
```

### Client (TypeScript)
```typescript
import { API_CONFIG, APP_LIMITS } from './config';

// Uses centralized API configuration
const api = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeout
});
```

### Vite (Client build)
```typescript
import baseConfig from '../config/base.json';

export default defineConfig({
  server: {
    port: baseConfig.ports.client,
    proxy: {
      '/api': {
        target: `http://localhost:${baseConfig.ports.server}`
      }
    }
  }
});
```

## Environment Variables

### Required
- `OPENAI_API_KEY` - OpenAI API key

### Optional
- `PORT` - Server port (default: 3002)
- `NODE_ENV` - Environment (default: 'development') 
- `REDIS_URL` - Redis connection URL
- `CORS_ORIGINS` - Comma-separated CORS origins
- `OPENAI_MODEL` - OpenAI model to use (default: 'gpt-4o-mini' for cost efficiency)
- `OPENAI_TEMPERATURE` - Model temperature (0-2, default: 0.3)
- `OPENAI_MAX_TOKENS` - Max tokens per request (default: 3000)
- `OPENAI_WEB_SEARCH_ENABLED` - Enable web search (default: true)
- `OPENAI_WEB_SEARCH_CONTEXT_SIZE` - Context size: 'high', 'medium', 'low' (default: 'medium')
- `LOG_LEVEL` - Logging level

## Benefits

1. **Single Source of Truth**: All configuration in one place
2. **Port Consistency**: No more port mismatches between client proxy and server
3. **Environment Flexibility**: Easy environment-specific overrides
4. **Type Safety**: Proper TypeScript typing for all config
5. **Validation**: Config validation on startup
6. **Documentation**: Self-documenting schema

## Migration Notes

- Replaced `config/shared-config.json` with `config/base.json`
- Fixed client proxy port mismatch (was pointing to 3002, now correctly uses 3002 from config)
- Centralized all port, API, and limit configurations
- Added validation for configuration ranges and requirements