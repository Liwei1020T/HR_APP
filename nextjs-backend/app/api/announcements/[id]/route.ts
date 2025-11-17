import { NextRequest } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateAnnouncementSchema } from '@/lib/validators/announcements';
import { formatDate } from '@/lib/utils';
import { handleApiError, handleNotFoundError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { getAttachmentsByEntity } from '@/lib/files';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);
    const announcementId = parseInt(params.id);

    const announcement = await db.announcement.findUnique({
      where: { id: announcementId },
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

    if (!announcement) {
      return handleNotFoundError('Announcement');
    }

    const attachments = (await getAttachmentsByEntity('announcement', [announcement.id]))[announcement.id] || [];

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
      attachments,
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
    await requireRole(request, 'HR');
    const announcementId = parseInt(params.id);
    const body = await request.json();
    const validated = updateAnnouncementSchema.parse(body);

    const announcement = await db.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      return handleNotFoundError('Announcement');
    }

    const updated = await db.announcement.update({
      where: { id: announcementId },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.content && { content: validated.content }),
        ...(validated.category && { category: validated.category }),
        ...(validated.is_pinned !== undefined && { isPinned: validated.is_pinned }),
        ...(validated.is_active !== undefined && { isActive: validated.is_active }),
        ...(validated.expires_at !== undefined && {
          expiresAt: validated.expires_at ? new Date(validated.expires_at) : null,
        }),
      },
    });

    const response = {
      id: updated.id,
      title: updated.title,
      content: updated.content,
      category: updated.category,
      is_pinned: updated.isPinned,
      is_active: updated.isActive,
      expires_at: updated.expiresAt ? formatDate(updated.expiresAt) : null,
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
    await requireRole(request, 'ADMIN');
    const announcementId = parseInt(params.id);

    const announcement = await db.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      return handleNotFoundError('Announcement');
    }

    await db.announcement.delete({
      where: { id: announcementId },
    });

    return corsResponse({ message: 'Announcement deleted successfully' }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
