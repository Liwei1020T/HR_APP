import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatUserResponse, getPaginationParams } from '@/lib/utils';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'HR');

    const { searchParams } = new URL(request.url);
    const { skip, limit } = getPaginationParams(searchParams);

    const users = await db.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await db.user.count();

    return corsResponse({ 
      users: users.map(formatUserResponse), 
      total 
    }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
