import baseConfig from '../../../config/base.json';

// Client-specific configuration
export const config = {
  api: {
    baseUrl: baseConfig.api.baseUrl,
    timeout: baseConfig.api.timeout,
  },
  limits: baseConfig.limits,
  ports: baseConfig.ports
};

// Export for components
export const API_CONFIG = config.api;
export const APP_LIMITS = config.limits;
export const PORTS = config.ports;