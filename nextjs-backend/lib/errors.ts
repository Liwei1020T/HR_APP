import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface ErrorResponse {
  detail: string;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Create standardized error response matching FastAPI format
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  errors?: Array<{ field: string; message: string }>
): NextResponse<ErrorResponse> {
  const body: ErrorResponse = { detail: message };
  if (errors) {
    body.errors = errors;
  }
  
  const response = NextResponse.json(body, { status });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: ZodError): NextResponse<ErrorResponse> {
  const errors = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return createErrorResponse('Validation error', 422, errors);
}

/**
 * Handle authentication errors
 */
export function handleAuthError(message: string = 'Authentication required'): NextResponse<ErrorResponse> {
  return createErrorResponse(message, 401);
}

/**
 * Handle authorization errors
 */
export function handleForbiddenError(message: string = 'Insufficient permissions'): NextResponse<ErrorResponse> {
  return createErrorResponse(message, 403);
}

/**
 * Handle not found errors
 */
export function handleNotFoundError(resource: string = 'Resource'): NextResponse<ErrorResponse> {
  return createErrorResponse(`${resource} not found`, 404);
}

/**
 * Handle conflict errors
 */
export function handleConflictError(message: string): NextResponse<ErrorResponse> {
  return createErrorResponse(message, 409);
}

/**
 * Handle internal server errors
 */
export function handleServerError(message: string = 'Internal server error'): NextResponse<ErrorResponse> {
  console.error('Server error:', message);
  return createErrorResponse(message, 500);
}

/**
 * Generic error handler for API routes
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  console.error('API Error:', error);

  // Zod validation error
  if (error instanceof ZodError) {
    return handleZodError(error);
  }

  // Custom error with message
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('authentication') || message.includes('token') || message.includes('unauthorized')) {
      return handleAuthError(error.message);
    }
    
    if (message.includes('permission') || message.includes('forbidden') || message.includes('role')) {
      return handleForbiddenError(error.message);
    }
    
    if (message.includes('not found')) {
      return handleNotFoundError(error.message);
    }
    
    if (message.includes('already exists') || message.includes('duplicate') || message.includes('conflict')) {
      return handleConflictError(error.message);
    }

    return createErrorResponse(error.message, 400);
  }

  // Unknown error
  return handleServerError();
}
