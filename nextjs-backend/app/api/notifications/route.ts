import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatDate, getPaginationParams, parseQueryBoolean } from '@/lib/utils';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';


export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const { skip, limit } = getPaginationParams(searchParams);
    const unreadOnly = parseQueryBoolean(searchParams.get('unread_only'));

    // Build base where clause
    const baseWhere = { userId: authUser.id };
    const queryWhere = unreadOnly ? { ...baseWhere, isRead: false } : baseWhere;

    // Fetch notifications with optimized query
    const notifications = await db.notification.findMany({
      where: queryWhere,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const formatted = notifications.map((n) => {
      const metadata =
        n.type === 'birthday_invite' && n.relatedEntityId
          ? { type: 'birthday_invite', eventId: n.relatedEntityId }
          : null;

      return {
        id: n.id,
        user_id: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        is_read: n.isRead,
        related_entity_type: n.relatedEntityType,
        related_entity_id: n.relatedEntityId,
        metadata: metadata ?? undefined,
        created_at: formatDate(n.createdAt),
      };
    });

    // Optimized: Count queries without OFFSET - Prisma was incorrectly adding OFFSET to COUNT
    const total = await db.notification.count({ where: baseWhere });
    const unread_count = await db.notification.count({
      where: { ...baseWhere, isRead: false }
    });

    return corsResponse({
      notifications: formatted,
      total,
      unread_count
    }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
