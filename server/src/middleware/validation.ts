// Validation middleware to reduce controller duplication
import { Request, Response, NextFunction } from 'express';
import { validateKeywords, validateKeyword, cleanKeywords } from '../utils/validation';
import { createErrorResponse } from '../utils/api';
import { apiLogger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      validatedKeywords?: string[];
      validatedKeyword?: string;
    }
  }
}

/**
 * Middleware to validate keywords query parameter
 */
export function validateKeywordsQuery(req: Request, res: Response, next: NextFunction): void {
  const keywords = req.query.keywords as string;
  
  if (!keywords) {
    apiLogger.warn('Keywords parameter missing', { query: req.query });
    res.status(400).json(createErrorResponse('Keywords parameter is required', 'INVALID_KEYWORDS'));
    return;
  }

  const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
  const validation = validateKeywords(keywordArray);
  
  if (!validation.isValid) {
    apiLogger.warn('Keywords validation failed', { keywords: keywordArray, error: validation.error });
    res.status(400).json(createErrorResponse(validation.error!, validation.code));
    return;
  }

  req.validatedKeywords = cleanKeywords(keywordArray);
  next();
}

/**
 * Middleware to validate keywords in request body
 */
export function validateKeywordsBody(req: Request, res: Response, next: NextFunction): void {
  const { keywords } = req.body;
  
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    apiLogger.warn('Invalid keywords in request body', { body: req.body });
    res.status(400).json(createErrorResponse('Keywords array is required', 'INVALID_KEYWORDS'));
    return;
  }

  const validation = validateKeywords(keywords);
  
  if (!validation.isValid) {
    apiLogger.warn('Keywords validation failed', { keywords, error: validation.error });
    res.status(400).json(createErrorResponse(validation.error!, validation.code));
    return;
  }

  req.validatedKeywords = cleanKeywords(keywords);
  next();
}

/**
 * Middleware to validate single keyword parameter
 */
export function validateKeywordParam(req: Request, res: Response, next: NextFunction): void {
  const keyword = req.params.keyword;
  
  if (!keyword || keyword.trim().length === 0) {
    apiLogger.warn('Keyword parameter missing or empty', { params: req.params });
    res.status(400).json(createErrorResponse('Keyword parameter is required', 'INVALID_KEYWORDS'));
    return;
  }

  const validation = validateKeyword(keyword);
  
  if (!validation.isValid) {
    apiLogger.warn('Keyword validation failed', { keyword, error: validation.error });
    res.status(400).json(createErrorResponse(validation.error!, validation.code));
    return;
  }

  req.validatedKeyword = keyword.trim();
  next();
}

/**
 * Global error handling middleware
 */
export function handleValidationError(
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  apiLogger.error('Validation error occurred', { error: error.message, stack: error.stack });
  
  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json(createErrorResponse(
    'Internal server error during validation',
    'VALIDATION_ERROR'
  ));
}