import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { handleApiError, handleNotFoundError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireAuth(request);
    const notificationId = parseInt(params.id);

    const notification = await db.notification.findFirst({
      where: {
        id: notificationId,
        userId: authUser.id,
      },
    });

    if (!notification) {
      return handleNotFoundError('Notification');
    }

    const updated = await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    const formatted = {
      id: updated.id,
      user_id: updated.userId,
      type: updated.type,
      title: updated.title,
      message: updated.message,
      is_read: updated.isRead,
      related_entity_type: updated.relatedEntityType,
      related_entity_id: updated.relatedEntityId,
      created_at: formatDate(updated.createdAt),
    };

    return corsResponse(formatted, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
