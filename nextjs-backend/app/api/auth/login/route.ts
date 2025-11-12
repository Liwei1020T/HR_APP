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
    console.log('Login attempt:', { email: body.email });
    
    const validated = loginSchema.parse(body);

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      console.log('User not found:', validated.email);
      return createErrorResponse('Invalid credentials', 401);
    }

    console.log('User found:', { id: user.id, email: user.email, role: user.role });

    // Verify password
    const isValidPassword = await verifyPassword(validated.password, user.password);
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Password verification failed');
      return createErrorResponse('Invalid credentials', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('User inactive:', user.email);
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

    console.log('Login successful:', user.email);
    return corsResponse(response, { request, status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return handleApiError(error);
  }
}
