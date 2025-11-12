import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createAccessToken, createRefreshToken, verifyPassword } from '@/lib/auth';
import { loginSchema, TokenResponse } from '@/lib/validators/auth';
import { handleApiError, createErrorResponse } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      return createErrorResponse('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await verifyPassword(validated.password, user.password);
    if (!isValidPassword) {
      return createErrorResponse('Invalid credentials', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      return createErrorResponse('Account is inactive', 403);
    }

    // Generate tokens
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    const response: TokenResponse = {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
    };

    return corsResponse(response, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
