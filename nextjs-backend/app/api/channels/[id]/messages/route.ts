import { NextRequest } from 'next/server';
import { requireAuth, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendChannelMessageSchema } from '@/lib/validators/channels';
import { formatDate } from '@/lib/utils';
import { handleApiError, handleForbiddenError, handleNotFoundError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { assignFilesToEntity, getAttachmentsByEntity } from '@/lib/files';

async function ensureChannelMember(channelId: number, userId: number) {
  const channel = await db.channel.findUnique({
    where: { id: channelId },
    select: { id: true, name: true },
  });

  if (!channel) {
    return { channelExists: false, membership: null, channel: null };
  }

  const membership = await db.channelMember.findFirst({
    where: {
      channelId,
      userId,
    },
  });

  return { channelExists: true, membership, channel };
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
    const channelId = parseInt(params.id);

    const { channelExists, membership } = await ensureChannelMember(channelId, authUser.id);

    if (!channelExists) {
      return handleNotFoundError('Channel');
    }

    if (!membership) {
      return handleForbiddenError('You must be a member to view this channel');
    }

    const messages = await db.channelMessage.findMany({
      where: { channelId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    const messageIds = messages.map((message) => message.id);
    const attachmentsMap = await getAttachmentsByEntity('channel_message', messageIds);

    const formatted = messages.map((message) => ({
      id: message.id,
      channel_id: message.channelId,
      user_id: message.userId,
      content: message.content,
      created_at: formatDate(message.createdAt),
      is_announcement: message.isAnnouncement,
      is_pinned: message.isPinned,
      user: {
        id: message.user.id,
        full_name: message.user.fullName,
        email: message.user.email,
      },
      attachments: attachmentsMap[message.id] || [],
    }));

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
    const channelId = parseInt(params.id);
    const payload = await request.json();
    const validated = sendChannelMessageSchema.parse(payload);
    const attachmentIds = validated.attachments ?? [];

    const { channelExists, membership, channel } = await ensureChannelMember(channelId, authUser.id);

    if (!channelExists) {
      return handleNotFoundError('Channel');
    }

    if (!membership) {
      return handleForbiddenError('Join the channel before sending messages');
    }

    if (validated.is_announcement && !hasRole(authUser, 'HR')) {
      return handleForbiddenError('Only HR/Admin can send announcements');
    }

    const message = await db.channelMessage.create({
      data: {
        channelId,
        userId: authUser.id,
        content: validated.content,
        isAnnouncement: validated.is_announcement,
        isPinned: validated.is_announcement,
        pinnedAt: validated.is_announcement ? new Date() : null,
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

    if (attachmentIds.length) {
      await assignFilesToEntity({
        attachmentIds,
        userId: authUser.id,
        entity: 'channel_message',
        entityId: message.id,
      });
    }

    if (validated.is_announcement) {
      const members = await db.channelMember.findMany({
        where: { channelId },
        select: { userId: true },
      });

      const recipients = members
        .map((member) => member.userId)
        .filter((userId) => userId !== authUser.id);

      for (const userId of recipients) {
        await db.notification.create({
          data: {
            userId,
            type: 'CHANNEL',
            title: 'Channel Announcement',
            message: `New announcement in ${channel?.name ?? 'channel'}`,
            relatedEntityType: 'channel',
            relatedEntityId: channelId,
          },
        });
      }
    }

    const attachments = (await getAttachmentsByEntity('channel_message', [message.id]))[message.id] || [];

    const response = {
      id: message.id,
      channel_id: message.channelId,
      user_id: message.userId,
      content: message.content,
      created_at: formatDate(message.createdAt),
      is_announcement: message.isAnnouncement,
      is_pinned: message.isPinned,
      user: {
        id: message.user.id,
        full_name: message.user.fullName,
        email: message.user.email,
      },
      attachments,
    };

    return corsResponse(response, { request, status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
