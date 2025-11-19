import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'HR');

    const total = await db.announcement.count();
    const active = await db.announcement.count({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
    const pinned = await db.announcement.count({
      where: { isPinned: true },
    });

    const byCategory = await db.announcement.groupBy({
      by: ['category'],
      _count: { category: true },
    });

    const byCategoryFormatted: Record<string, number> = {};
    byCategory.forEach((item) => {
      byCategoryFormatted[item.category] = item._count.category;
    });

    const response = {
      total,
      active,
      pinned,
      by_category: byCategoryFormatted,
    };

    return corsResponse(response, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
