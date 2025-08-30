import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
) => {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    success: false,
    error: error.message,
    message: 'An error occurred while processing your request'
  });
};