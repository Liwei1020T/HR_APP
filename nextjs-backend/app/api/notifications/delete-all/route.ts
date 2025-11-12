import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    const result = await db.notification.deleteMany({
      where: {
        userId: authUser.id,
      },
    });

    return corsResponse({ deleted: result.count }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
