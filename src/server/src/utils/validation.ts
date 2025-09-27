// Server-specific validation utilities
import { APP_LIMITS } from '../config';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  code?: string;
}

export function validateKeywords(keywords: string[], maxKeywords = APP_LIMITS.maxKeywords): ValidationResult {
  if (!keywords || !Array.isArray(keywords)) {
    return { isValid: false, error: 'Keywords must be an array', code: 'VALIDATION_ERROR' };
  }

  if (keywords.length === 0) {
    return { isValid: false, error: 'At least one keyword is required', code: 'INVALID_KEYWORDS' };
  }

  if (keywords.length > maxKeywords) {
    return { 
      isValid: false, 
      error: `Maximum ${maxKeywords} keywords allowed`, 
      code: 'TOO_MANY_KEYWORDS' 
    };
  }

  for (const keyword of keywords) {
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return { isValid: false, error: 'Keywords must be non-empty strings', code: 'INVALID_KEYWORDS' };
    }

    if (keyword.length > 100) {
      return { 
        isValid: false, 
        error: 'Keywords must be 100 characters or less', 
        code: 'KEYWORD_TOO_LONG' 
      };
    }
  }

  return { isValid: true };
}

export function validateKeyword(keyword: string): ValidationResult {
  return validateKeywords([keyword], 1);
}

export function cleanKeywords(keywords: string[]): string[] {
  return keywords
    .map(k => k.trim())
    .filter(k => k.length > 0)
    .slice(0, APP_LIMITS.maxKeywords);
}

export function validateMaxResults(maxResults: number): ValidationResult {
  if (!Number.isInteger(maxResults) || maxResults < APP_LIMITS.minResultsPerKeyword) {
    return { 
      isValid: false, 
      error: `Max results must be at least ${APP_LIMITS.minResultsPerKeyword}`, 
      code: 'INVALID_MAX_RESULTS' 
    };
  }

  if (maxResults > APP_LIMITS.maxResultsPerKeyword) {
    return { 
      isValid: false, 
      error: `Max results cannot exceed ${APP_LIMITS.maxResultsPerKeyword}`, 
      code: 'INVALID_MAX_RESULTS' 
    };
  }

  return { isValid: true };
}