import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { joinChannelSchema } from '@/lib/validators/memberships';
import { handleApiError, handleNotFoundError, handleConflictError, handleForbiddenError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { formatDate } from '@/lib/utils';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const validated = joinChannelSchema.parse(body);

    // Check if channel exists
    const channel = await db.channel.findUnique({
      where: { id: validated.channel_id },
    });

    if (!channel) {
      return handleNotFoundError('Channel');
    }

    // Cannot join private channels (must be invited)
    if (channel.isPrivate) {
      return handleForbiddenError('Cannot join private channel');
    }

    // Check if already a member
    const existing = await db.channelMember.findFirst({
      where: {
        userId: authUser.id,
        channelId: validated.channel_id,
      },
    });

    if (existing) {
      return handleConflictError('Already a member of this channel');
    }

    // Join channel
    const membership = await db.channelMember.create({
      data: {
        userId: authUser.id,
        channelId: validated.channel_id,
        role: 'MEMBER',
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            description: true,
            channelType: true,
          },
        },
      },
    });

    const response = {
      id: membership.id,
      user_id: membership.userId,
      channel_id: membership.channelId,
      role: membership.role,
      joined_at: formatDate(membership.joinedAt),
      channel: {
        id: membership.channel.id,
        name: membership.channel.name,
        description: membership.channel.description,
        channel_type: membership.channel.channelType,
      },
    };

    return corsResponse(response, { request, status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
