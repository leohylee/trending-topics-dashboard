// Shared validation utilities
import type { ErrorCode } from '../types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  code?: ErrorCode;
}

/**
 * Validates keyword array for API requests
 */
export function validateKeywords(keywords: string[], maxKeywords = 10): ValidationResult {
  if (!keywords || !Array.isArray(keywords)) {
    return {
      isValid: false,
      error: 'Keywords must be an array',
      code: 'VALIDATION_ERROR'
    };
  }

  const cleanKeywords = keywords.filter(k => k && typeof k === 'string' && k.trim().length > 0);
  
  if (cleanKeywords.length === 0) {
    return {
      isValid: false,
      error: 'At least one valid keyword is required',
      code: 'INVALID_KEYWORDS'
    };
  }

  if (cleanKeywords.length > maxKeywords) {
    return {
      isValid: false,
      error: `Maximum ${maxKeywords} keywords allowed`,
      code: 'INVALID_KEYWORDS'
    };
  }

  return { isValid: true };
}

/**
 * Validates and cleans a single keyword
 */
export function validateKeyword(keyword: string): ValidationResult {
  if (!keyword || typeof keyword !== 'string') {
    return {
      isValid: false,
      error: 'Keyword must be a non-empty string',
      code: 'VALIDATION_ERROR'
    };
  }

  const cleaned = keyword.trim();
  if (cleaned.length === 0) {
    return {
      isValid: false,
      error: 'Keyword cannot be empty',
      code: 'VALIDATION_ERROR'
    };
  }

  if (cleaned.length > 100) {
    return {
      isValid: false,
      error: 'Keyword too long (max 100 characters)',
      code: 'VALIDATION_ERROR'
    };
  }

  return { isValid: true };
}

/**
 * Validates maxResults parameter
 */
export function validateMaxResults(maxResults: number, min = 1, max = 10): ValidationResult {
  if (!Number.isInteger(maxResults) || maxResults < min || maxResults > max) {
    return {
      isValid: false,
      error: `maxResults must be an integer between ${min} and ${max}`,
      code: 'VALIDATION_ERROR'
    };
  }

  return { isValid: true };
}

/**
 * Sanitizes and cleans keywords array
 */
export function cleanKeywords(keywords: string[]): string[] {
  return keywords
    .filter(k => k && typeof k === 'string')
    .map(k => k.trim())
    .filter(k => k.length > 0);
}