import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { formatUserResponse } from '@/lib/utils';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { db } from '@/lib/db';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    
    // Fetch full user details
    const user = await db.user.findUnique({
      where: { id: authUser.id },
    });

    if (!user) {
      return handleApiError(new Error('User not found'));
    }

    return corsResponse(formatUserResponse(user), { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
