import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleApiError, handleNotFoundError, handleForbiddenError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireAuth(request);
    const notificationId = parseInt(params.id);

    const notification = await db.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return handleNotFoundError('Notification');
    }

    if (notification.userId !== authUser.id) {
      return handleForbiddenError('Cannot delete another user\'s notification');
    }

    await db.notification.delete({
      where: { id: notificationId },
    });

    return corsResponse({ message: 'Notification deleted successfully' }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
