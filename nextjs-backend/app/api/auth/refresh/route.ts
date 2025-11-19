import { NextRequest, NextResponse } from 'next/server';
import { createAccessToken, verifyToken } from '@/lib/auth';
import { refreshTokenSchema, AccessTokenResponse } from '@/lib/validators/auth';
import { handleApiError, createErrorResponse } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { db } from '@/lib/db';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = refreshTokenSchema.parse(body);

    // Verify refresh token
    const payload = verifyToken(validated.refresh_token);
    
    if (payload.type !== 'refresh') {
      return createErrorResponse('Invalid token type', 401);
    }

    // Verify user still exists and is active
    const user = await db.user.findUnique({
      where: { id: parseInt(payload.sub) },
    });

    if (!user || !user.isActive) {
      return createErrorResponse('User not found or inactive', 401);
    }

    // Generate new access token
    const accessToken = createAccessToken(user);

    const response: AccessTokenResponse = {
      access_token: accessToken,
      token_type: 'bearer',
    };

    return corsResponse(response, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
