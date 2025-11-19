import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { markAsReadSchema } from '@/lib/validators/notifications';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const validated = markAsReadSchema.parse(body);

    await db.notification.updateMany({
      where: {
        id: { in: validated.notification_ids },
        userId: authUser.id, // Ensure user owns these notifications
      },
      data: {
        isRead: true,
      },
    });

    return corsResponse({ message: 'Notifications marked as read' }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
