import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleApiError, handleForbiddenError, handleNotFoundError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { formatDate } from '@/lib/utils';

const ALLOWED_ROLES = ['HR', 'ADMIN', 'SUPERADMIN', 'VENDOR'];

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireAuth(request);
    const role = (authUser.role || '').toUpperCase();

    // Employees cannot view the activity timeline
    if (!ALLOWED_ROLES.includes(role)) {
      return handleForbiddenError('Not permitted');
    }

    const feedbackId = parseInt(params.id);

    const feedback = await db.feedback.findUnique({
      where: { id: feedbackId },
      select: {
        id: true,
        vendorAssignedTo: true,
      },
    });

    if (!feedback) {
      return handleNotFoundError('Feedback');
    }

    // Vendors can only see timelines for feedback assigned to them
    if (role === 'VENDOR' && feedback.vendorAssignedTo !== authUser.id) {
      return handleForbiddenError('Not permitted');
    }

    const logs = await db.auditLog.findMany({
      where: {
        entityType: 'feedback',
        entityId: feedbackId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const events = logs.map((log) => ({
      id: log.id,
      user_id: log.userId ?? undefined,
      action: log.action,
      entity_type: log.entityType ?? undefined,
      entity_id: log.entityId ?? undefined,
      details: log.details ?? undefined,
      ip_address: log.ipAddress ?? undefined,
      created_at: formatDate(log.createdAt),
      user: log.user
        ? {
            id: log.user.id,
            email: log.user.email,
            full_name: log.user.fullName,
          }
        : null,
    }));

    return corsResponse(
      {
        events,
        total: events.length,
      },
      { request, status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

