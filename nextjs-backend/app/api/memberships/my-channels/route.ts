import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    const memberships = await db.channelMember.findMany({
      where: { userId: authUser.id },
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
      orderBy: { joinedAt: 'desc' },
    });

    const formatted = memberships.map((m) => ({
      id: m.id,
      user_id: m.userId,
      channel_id: m.channelId,
      role: m.role,
      joined_at: formatDate(m.joinedAt),
      channel: {
        id: m.channel.id,
        name: m.channel.name,
        description: m.channel.description,
        channel_type: m.channel.channelType,
      },
    }));

    return corsResponse(formatted, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
