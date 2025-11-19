import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateChannelSchema } from '@/lib/validators/channels';
import { formatDate } from '@/lib/utils';
import { handleApiError, handleNotFoundError, handleForbiddenError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

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

    const channel = await db.channel.findUnique({
      where: { id: channelId },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!channel) {
      return handleNotFoundError('Channel');
    }

    // Check access for private channels
    if (channel.isPrivate && channel.createdBy !== authUser.id) {
      const membership = await db.channelMember.findFirst({
        where: {
          channelId: channel.id,
          userId: authUser.id,
        },
      });

      if (!membership) {
        return handleForbiddenError('You do not have access to this private channel');
      }
    }

    const response = {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      channel_type: channel.channelType,
      is_private: channel.isPrivate,
      created_by: channel.createdBy,
      created_at: formatDate(channel.createdAt),
      updated_at: formatDate(channel.updatedAt),
      member_count: channel._count.members,
      creator: {
        id: channel.creator.id,
        email: channel.creator.email,
        full_name: channel.creator.fullName,
      },
    };

    return corsResponse(response, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireAuth(request);
    const channelId = parseInt(params.id);
    const body = await request.json();
    const validated = updateChannelSchema.parse(body);

    const channel = await db.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return handleNotFoundError('Channel');
    }

    // Only creator or moderators can update
    if (channel.createdBy !== authUser.id) {
      const membership = await db.channelMember.findFirst({
        where: {
          channelId: channel.id,
          userId: authUser.id,
          role: 'MODERATOR',
        },
      });

      if (!membership) {
        return handleForbiddenError('Only channel creator or moderators can update');
      }
    }

    const updated = await db.channel.update({
      where: { id: channelId },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.channel_type && { channelType: validated.channel_type }),
        ...(validated.is_private !== undefined && { isPrivate: validated.is_private }),
      },
    });

    const response = {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      channel_type: updated.channelType,
      is_private: updated.isPrivate,
      created_by: updated.createdBy,
      created_at: formatDate(updated.createdAt),
      updated_at: formatDate(updated.updatedAt),
    };

    return corsResponse(response, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireAuth(request);
    const channelId = parseInt(params.id);

    const channel = await db.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return handleNotFoundError('Channel');
    }

    // Only creator can delete
    if (channel.createdBy !== authUser.id) {
      return handleForbiddenError('Only channel creator can delete');
    }

    await db.channel.delete({
      where: { id: channelId },
    });

    return corsResponse({ message: 'Channel deleted successfully' }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
