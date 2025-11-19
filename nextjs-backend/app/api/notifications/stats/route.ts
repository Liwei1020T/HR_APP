import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    const total = await db.notification.count({
      where: { userId: authUser.id },
    });

    const unread = await db.notification.count({
      where: { userId: authUser.id, isRead: false },
    });

    const byType = await db.notification.groupBy({
      by: ['type'],
      where: { userId: authUser.id },
      _count: { type: true },
    });

    const byTypeFormatted: Record<string, number> = {};
    byType.forEach((item) => {
      byTypeFormatted[item.type] = item._count.type;
    });

    const response = {
      total,
      unread,
      by_type: byTypeFormatted,
    };

    return corsResponse(response, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
