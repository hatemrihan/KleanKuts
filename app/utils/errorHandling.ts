/**
 * Utility functions for API error handling
 */

import { NextResponse } from 'next/server';

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string;
  details?: string[];
  code?: string;
}

/**
 * Handle database connection errors with appropriate responses
 */
export function handleDatabaseError(error: any): NextResponse<ErrorResponse> {
  console.error('Database error:', error);
  
  // Check if it's a connection error
  if (error.name === 'MongoNetworkError' || 
      error.message?.includes('connect') || 
      error.message?.includes('connection')) {
    return NextResponse.json({
      error: 'Database connection error',
      details: ['Unable to connect to the database. Please try again later.'],
      code: 'DB_CONNECTION_ERROR'
    }, { status: 503 });
  }
  
  // Authentication errors
  if (error.name === 'MongoServerSelectionError' || 
      error.message?.includes('authentication')) {
    return NextResponse.json({
      error: 'Database authentication error',
      details: ['Server configuration issue. Please contact support.'],
      code: 'DB_AUTH_ERROR'
    }, { status: 500 });
  }
  
  // Default error response
  return NextResponse.json({
    error: 'Database error',
    details: [error.message || 'An unexpected database error occurred'],
    code: 'DB_ERROR'
  }, { status: 500 });
}

/**
 * Handle API errors with appropriate responses
 */
export function handleApiError(error: any): NextResponse<ErrorResponse> {
  console.error('API error:', error);
  
  // Default error response
  return NextResponse.json({
    error: 'API error',
    details: [error.message || 'An unexpected error occurred'],
    code: 'API_ERROR'
  }, { status: 500 });
}
