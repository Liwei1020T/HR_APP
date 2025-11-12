import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatDate, getPaginationParams } from '@/lib/utils';
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
    const { searchParams } = new URL(request.url);
    const { skip, limit } = getPaginationParams(searchParams);

    const channel = await db.channel.findUnique({
      where: { id: channelId },
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

    const members = await db.channelMember.findMany({
      where: { channelId: channelId },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            department: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    const formatted = members.map((m) => ({
      id: m.id,
      channel_id: m.channelId,
      user_id: m.userId,
      role: m.role,
      joined_at: formatDate(m.joinedAt),
      user: {
        id: m.user.id,
        email: m.user.email,
        full_name: m.user.fullName,
        role: m.user.role,
        department: m.user.department,
      },
    }));

    const total = await db.channelMember.count({ where: { channelId: channelId } });

    return corsResponse({ members: formatted, total }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
