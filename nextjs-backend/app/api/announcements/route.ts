import { NextRequest } from 'next/server';
import { requireAuth, requireRole, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { createAnnouncementSchema } from '@/lib/validators/announcements';
import { formatDate, getPaginationParams, parseQueryBoolean } from '@/lib/utils';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { sendAnnouncementNotification } from '@/lib/mail';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const { skip, limit } = getPaginationParams(searchParams);
    const activeOnly = parseQueryBoolean(searchParams.get('active_only'), true);
    const categoryFilter = searchParams.get('category');

    const where: any = {};

    if (activeOnly) {
      where.isActive = true;
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ];
    }

    if (categoryFilter) {
      where.category = categoryFilter;
    }

    const announcements = await db.announcement.findMany({
      where,
      skip,
      take: limit,
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const formatted = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      category: a.category,
      is_pinned: a.isPinned,
      is_active: a.isActive,
      expires_at: a.expiresAt ? formatDate(a.expiresAt) : null,
      created_by: a.createdBy,
      created_at: formatDate(a.createdAt),
      updated_at: formatDate(a.updatedAt),
      creator: {
        id: a.creator.id,
        email: a.creator.email,
        full_name: a.creator.fullName,
      },
    }));

    return corsResponse(formatted, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, 'HR');
    const authUser = await requireAuth(request);
    const body = await request.json();
    const validated = createAnnouncementSchema.parse(body);

    const announcement = await db.announcement.create({
      data: {
        title: validated.title,
        content: validated.content,
        category: validated.category || 'OTHER',
        isPinned: validated.is_pinned || false,
        isActive: true,
        expiresAt: validated.expires_at ? new Date(validated.expires_at) : null,
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

    // Create notifications for all active users
    const activeUsers = await db.user.findMany({
      where: { isActive: true, id: { not: authUser.id } },
      select: { id: true, email: true, fullName: true },
    });

    for (const user of activeUsers) {
      await db.notification.create({
        data: {
          userId: user.id,
          type: 'ANNOUNCEMENT',
          title: 'New Announcement',
          message: `New announcement: ${validated.title}`,
          relatedEntityType: 'announcement',
          relatedEntityId: announcement.id,
        },
      });

      // Send email notification (async, don't await)
      sendAnnouncementNotification(user.email, user.fullName, validated.title, announcement.id).catch(console.error);
    }

    const response = {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      is_pinned: announcement.isPinned,
      is_active: announcement.isActive,
      expires_at: announcement.expiresAt ? formatDate(announcement.expiresAt) : null,
      created_by: announcement.createdBy,
      created_at: formatDate(announcement.createdAt),
      updated_at: formatDate(announcement.updatedAt),
      creator: {
        id: announcement.creator.id,
        email: announcement.creator.email,
        full_name: announcement.creator.fullName,
      },
    };

    return corsResponse(response, { request, status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
