import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { createChannelSchema } from '@/lib/validators/channels';
import { formatDate, getPaginationParams } from '@/lib/utils';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const { skip, limit } = getPaginationParams(searchParams);

    const where = {
      OR: [
        { isPrivate: false },
        { createdBy: authUser.id },
        { members: { some: { userId: authUser.id } } },
      ],
    };

    const channels = await db.channel.findMany({
      skip,
      take: limit,
      where,
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
      orderBy: { createdAt: 'desc' },
    });

    const formatted = channels.map((ch) => ({
      id: ch.id,
      name: ch.name,
      description: ch.description,
      channel_type: ch.channelType,
      is_private: ch.isPrivate,
      created_by: ch.createdBy,
      created_at: formatDate(ch.createdAt),
      updated_at: formatDate(ch.updatedAt),
      member_count: ch._count.members,
      creator: {
        id: ch.creator.id,
        email: ch.creator.email,
        full_name: ch.creator.fullName,
      },
    }));

    const total = await db.channel.count({ where });

    return corsResponse({ channels: formatted, total }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const validated = createChannelSchema.parse(body);

    const channel = await db.channel.create({
      data: {
        name: validated.name,
        description: validated.description || null,
        channelType: validated.channel_type || 'general',
        isPrivate: validated.is_private || false,
        createdBy: authUser.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    // Auto-join creator as moderator
    await db.channelMember.create({
      data: {
        userId: authUser.id,
        channelId: channel.id,
        role: 'MODERATOR',
      },
    });

    const response = {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      channel_type: channel.channelType,
      is_private: channel.isPrivate,
      created_by: channel.createdBy,
      created_at: formatDate(channel.createdAt),
      updated_at: formatDate(channel.updatedAt),
      creator: {
        id: channel.creator.id,
        email: channel.creator.email,
        full_name: channel.creator.fullName,
      },
    };

    return corsResponse(response, { request, status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
