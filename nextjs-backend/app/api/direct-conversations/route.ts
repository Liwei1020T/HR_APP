import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleApiError, handleForbiddenError, handleNotFoundError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { buildDirectConversationKey, formatDate, getPaginationParams } from '@/lib/utils';
import { startDirectConversationSchema } from '@/lib/validators/directMessages';

type ConversationWithRelations = NonNullable<
  Awaited<
    ReturnType<typeof db.directConversation.findFirst>
  >
> & {
  participants: Array<{
    id: number;
    userId: number;
    joinedAt: Date;
    lastReadMessageId: number | null;
    user: {
      id: number;
      fullName: string;
      email: string;
      department: string | null;
    };
  }>;
  messages: Array<{
    id: number;
    content: string;
    createdAt: Date;
    editedAt: Date | null;
    sender: {
      id: number;
      fullName: string;
      email: string;
    };
  }>;
};

const participantUserSelect = {
  id: true,
  fullName: true,
  email: true,
  department: true,
};

const conversationInclude: Prisma.DirectConversationInclude = {
  participants: {
    include: {
      user: {
        select: participantUserSelect,
      },
    },
  },
  messages: {
    take: 1,
    orderBy: { createdAt: Prisma.SortOrder.desc },
    include: {
      sender: {
        select: participantUserSelect,
      },
    },
  },
};

function formatConversation(conversation: ConversationWithRelations, authUserId: number) {
  const membership = conversation.participants.find((participant) => participant.userId === authUserId);
  const lastMessage = conversation.messages[0] ?? null;

  return {
    id: conversation.id,
    topic: conversation.topic,
    created_by: conversation.createdBy,
    created_at: formatDate(conversation.createdAt),
    updated_at: formatDate(conversation.updatedAt),
    last_message_at: conversation.lastMessageAt ? formatDate(conversation.lastMessageAt) : null,
    participants: conversation.participants.map((participant) => ({
      id: participant.id,
      user_id: participant.userId,
      joined_at: formatDate(participant.joinedAt),
      last_read_message_id: participant.lastReadMessageId,
      user: {
        id: participant.user.id,
        full_name: participant.user.fullName,
        email: participant.user.email,
        department: participant.user.department,
      },
    })),
    last_message: lastMessage
      ? {
          id: lastMessage.id,
          content: lastMessage.content,
          created_at: formatDate(lastMessage.createdAt),
          edited_at: lastMessage.editedAt ? formatDate(lastMessage.editedAt) : null,
          sender: {
            id: lastMessage.sender.id,
            full_name: lastMessage.sender.fullName,
            email: lastMessage.sender.email,
          },
        }
      : null,
    has_unread:
      !!lastMessage &&
      (!membership?.lastReadMessageId || lastMessage.id > (membership.lastReadMessageId ?? 0)),
  };
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const { skip, limit } = getPaginationParams(searchParams);

    const conversations = await db.directConversation.findMany({
      where: {
        participants: {
          some: { userId: authUser.id },
        },
      },
      skip,
      take: limit,
      orderBy: [
        { lastMessageAt: Prisma.SortOrder.desc },
        { updatedAt: Prisma.SortOrder.desc },
      ],
      include: conversationInclude,
    });

    const total = await db.directConversation.count({
      where: {
        participants: {
          some: { userId: authUser.id },
        },
      },
    });

    const formatted = conversations.map((conversation) => formatConversation(conversation, authUser.id));

    return corsResponse({ conversations: formatted, total }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const payload = await request.json();
    const validated = startDirectConversationSchema.parse(payload);

    if (validated.target_user_id === authUser.id) {
      return handleForbiddenError('Cannot start a conversation with yourself');
    }

    const targetUser = await db.user.findUnique({
      where: { id: validated.target_user_id },
      select: {
        id: true,
        fullName: true,
        email: true,
        department: true,
        isActive: true,
      },
    });

    if (!targetUser || !targetUser.isActive) {
      return handleNotFoundError('User');
    }

    const participantKey = buildDirectConversationKey(authUser.id, targetUser.id);

    let conversation = await db.directConversation.findUnique({
      where: { participantKey },
      include: conversationInclude,
    });

    let status = 200;

    if (!conversation) {
      conversation = await db.directConversation.create({
        data: {
          participantKey,
          topic: validated.topic || null,
          createdBy: authUser.id,
          participants: {
            create: [
              { userId: authUser.id },
              { userId: targetUser.id },
            ],
          },
        },
        include: conversationInclude,
      });
      status = 201;
    }

    return corsResponse(formatConversation(conversation, authUser.id), { request, status });
  } catch (error) {
    return handleApiError(error);
  }
}
