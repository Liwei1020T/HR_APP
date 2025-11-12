import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { leaveChannelSchema } from '@/lib/validators/memberships';
import { handleApiError, handleNotFoundError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const validated = leaveChannelSchema.parse(body);

    const membership = await db.channelMember.findFirst({
      where: {
        userId: authUser.id,
        channelId: validated.channel_id,
      },
    });

    if (!membership) {
      return handleNotFoundError('Membership');
    }

    await db.channelMember.delete({
      where: { id: membership.id },
    });

    return corsResponse({ message: 'Left channel successfully' }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
