import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleApiError, handleForbiddenError, handleNotFoundError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { formatDate, getPaginationParams } from '@/lib/utils';
import { sendDirectMessageSchema } from '@/lib/validators/directMessages';
import { assignFilesToEntity, getAttachmentsByEntity, AttachmentResponse } from '@/lib/files';

const senderSelect = {
  id: true,
  fullName: true,
  email: true,
  department: true,
};

async function ensureConversationParticipant(conversationId: number, userId: number) {
  const conversation = await db.directConversation.findUnique({
    where: { id: conversationId },
    select: { id: true },
  });

  if (!conversation) {
    return { exists: false, participant: null };
  }

  const participant = await db.directConversationParticipant.findFirst({
    where: { conversationId, userId },
  });

  return { exists: true, participant };
}

function formatMessage(
  message: NonNullable<Awaited<ReturnType<typeof db.directMessage.findFirst>>>,
  attachments: AttachmentResponse[]
) {
  return {
    id: message.id,
    conversation_id: message.conversationId,
    sender_id: message.senderId,
    content: message.content,
    created_at: formatDate(message.createdAt),
    edited_at: message.editedAt ? formatDate(message.editedAt) : null,
    sender: {
      id: message.sender.id,
      full_name: message.sender.fullName,
      email: message.sender.email,
      department: message.sender.department,
    },
    attachments,
  };
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireAuth(request);
    const conversationId = parseInt(params.id, 10);

    if (Number.isNaN(conversationId)) {
      return handleNotFoundError('Conversation');
    }

    const { exists, participant } = await ensureConversationParticipant(conversationId, authUser.id);

    if (!exists) {
      return handleNotFoundError('Conversation');
    }

    if (!participant) {
      return handleForbiddenError('You are not part of this conversation');
    }

    const { searchParams } = new URL(request.url);
    const { skip, limit } = getPaginationParams(searchParams);

    const messages = await db.directMessage.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: senderSelect,
        },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    });

    const messageIds = messages.map((message) => message.id);
    const attachmentsMap = await getAttachmentsByEntity('direct_message', messageIds);

    const formatted = messages.map((message) =>
      formatMessage(message, attachmentsMap[message.id] || [])
    );

    return corsResponse({ messages: formatted }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireAuth(request);
    const conversationId = parseInt(params.id, 10);

    if (Number.isNaN(conversationId)) {
      return handleNotFoundError('Conversation');
    }

    const { exists, participant } = await ensureConversationParticipant(conversationId, authUser.id);

    if (!exists) {
      return handleNotFoundError('Conversation');
    }

    if (!participant) {
      return handleForbiddenError('You are not part of this conversation');
    }

    const payload = await request.json();
    const validated = sendDirectMessageSchema.parse(payload);
    const attachmentIds = validated.attachments ?? [];

    const message = await db.directMessage.create({
      data: {
        conversationId,
        senderId: authUser.id,
        content: validated.content,
      },
      include: {
        sender: {
          select: senderSelect,
        },
      },
    });

    if (attachmentIds.length) {
      await assignFilesToEntity({
        attachmentIds,
        userId: authUser.id,
        entity: 'direct_message',
        entityId: message.id,
      });
    }

    await db.directConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: message.createdAt,
      },
    });

    await db.directConversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: authUser.id,
        },
      },
      data: {
        lastReadMessageId: message.id,
      },
    });

    const recipients = await db.directConversationParticipant.findMany({
      where: {
        conversationId,
        userId: { not: authUser.id },
      },
      select: { userId: true },
    });

    await Promise.all(
      recipients.map(({ userId }) =>
        db.notification.create({
          data: {
            userId,
            type: 'DIRECT_MESSAGE',
            title: `New message from ${authUser.fullName}`,
            message: validated.content.slice(0, 140),
            relatedEntityType: 'direct_conversation',
            relatedEntityId: conversationId,
          },
        })
      )
    );

    const attachmentsMap = await getAttachmentsByEntity('direct_message', [message.id]);
    const formatted = formatMessage(message, attachmentsMap[message.id] || []);

    return corsResponse(formatted, { request, status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
