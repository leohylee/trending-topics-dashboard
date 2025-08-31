// Shared logging utility to replace console.log statements
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private context: string = 'App';

  private constructor() {
    // Set log level from environment
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    if (envLevel && envLevel in LogLevel) {
      this.logLevel = LogLevel[envLevel as keyof typeof LogLevel];
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  withContext(context: string): Logger {
    const logger = new Logger();
    logger.logLevel = this.logLevel;
    logger.context = context;
    return logger;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (level <= this.logLevel) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        context: this.context,
        data
      };

      this.output(entry);
    }
  }

  private output(entry: LogEntry): void {
    const emoji = this.getLevelEmoji(entry.level);
    const levelName = LogLevel[entry.level];
    const prefix = `${emoji} [${levelName}] ${entry.context}:`;
    
    if (entry.data) {
      console.log(prefix, entry.message, entry.data);
    } else {
      console.log(prefix, entry.message);
    }
  }

  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR: return '❌';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.TRACE: return '📝';
      default: return '•';
    }
  }

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  trace(message: string, data?: any): void {
    this.log(LogLevel.TRACE, message, data);
  }

  // Convenience methods for specific use cases
  apiRequest(method: string, url: string, data?: any): void {
    this.debug(`${method} ${url}`, data);
  }

  apiResponse(status: number, message: string, data?: any): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.DEBUG;
    this.log(level, `Response ${status}: ${message}`, data);
  }

  cacheHit(key: string): void {
    this.trace(`Cache HIT: ${key}`);
  }

  cacheMiss(key: string): void {
    this.trace(`Cache MISS: ${key}`);
  }

  webSearch(keyword: string, resultCount: number): void {
    this.info(`Web search completed for "${keyword}": ${resultCount} results`);
  }

  jsonParse(success: boolean, keyword: string, error?: string): void {
    if (success) {
      this.debug(`JSON parsing successful for: ${keyword}`);
    } else {
      this.warn(`JSON parsing failed for: ${keyword}`, error);
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export context-specific loggers
export const apiLogger = logger.withContext('API');
export const cacheLogger = logger.withContext('Cache');
export const openaiLogger = logger.withContext('OpenAI');
export const webLogger = logger.withContext('WebSearch');