import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleApiError, handleForbiddenError, handleNotFoundError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { markDirectConversationReadSchema } from '@/lib/validators/directMessages';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireAuth(request);
    const conversationId = parseInt(params.id, 10);

    if (Number.isNaN(conversationId)) {
      return handleNotFoundError('Conversation');
    }

    const conversation = await db.directConversation.findUnique({
      where: { id: conversationId },
      select: { id: true },
    });

    if (!conversation) {
      return handleNotFoundError('Conversation');
    }

    const participant = await db.directConversationParticipant.findFirst({
      where: { conversationId, userId: authUser.id },
    });

    if (!participant) {
      return handleForbiddenError('You are not part of this conversation');
    }

    const payload = await request.json();
    const validated = markDirectConversationReadSchema.parse(payload);

    let lastReadMessageId = validated.last_read_message_id ?? null;

    if (lastReadMessageId !== null) {
      const message = await db.directMessage.findFirst({
        where: { id: lastReadMessageId, conversationId },
        select: { id: true },
      });

      if (!message) {
        return handleNotFoundError('Message');
      }
    } else {
      const latestMessage = await db.directMessage.findFirst({
        where: { conversationId },
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      lastReadMessageId = latestMessage?.id ?? null;
    }

    await db.directConversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: authUser.id,
        },
      },
      data: {
        lastReadMessageId,
      },
    });

    return corsResponse({ success: true, last_read_message_id: lastReadMessageId }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
