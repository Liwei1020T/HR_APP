import { NextRequest } from 'next/server';
import { requireAuth, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { pinChannelMessageSchema } from '@/lib/validators/channels';
import { formatDate } from '@/lib/utils';
import { handleApiError, handleForbiddenError, handleNotFoundError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const authUser = await requireAuth(request);
    if (!hasRole(authUser, 'HR')) {
      return handleForbiddenError('Only HR/Admin can pin messages');
    }

    const channelId = parseInt(params.id);
    const messageId = parseInt(params.messageId);
    const payload = await request.json();
    const validated = pinChannelMessageSchema.parse(payload);

    const message = await db.channelMessage.findFirst({
      where: {
        id: messageId,
        channelId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!message) {
      return handleNotFoundError('Channel message');
    }

    const updated = await db.channelMessage.update({
      where: { id: message.id },
      data: {
        isPinned: validated.is_pinned,
        pinnedAt: validated.is_pinned ? new Date() : null,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return corsResponse(
      {
        id: updated.id,
        channel_id: updated.channelId,
        user_id: updated.userId,
        content: updated.content,
        created_at: formatDate(updated.createdAt),
        is_announcement: updated.isAnnouncement,
        is_pinned: updated.isPinned,
        user: {
          id: updated.user.id,
          full_name: updated.user.fullName,
          email: updated.user.email,
        },
      },
      { request, status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
