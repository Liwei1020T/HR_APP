import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleApiError, handleForbiddenError, handleNotFoundError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await requireRole(request, 'HR');
    const feedbackId = parseInt(params.id);
    const body = await request.json();
    const message: string = (body.message || '').trim();

    const feedback = await db.feedback.findUnique({ where: { id: feedbackId } });
    if (!feedback) return handleNotFoundError('Feedback');

    if (feedback.vendorStatus !== 'VENDOR_REPLIED' && feedback.vendorStatus !== 'FORWARDED') {
      return handleForbiddenError('Vendor reply required before superadmin review');
    }

    const updated = await db.feedback.update({
      where: { id: feedbackId },
      data: {
        vendorStatus: 'AWAITING_SUPERADMIN',
        vendorLastResponseAt: new Date(),
      },
    });

    // Audit log: requested superadmin approval
    await db.auditLog.create({
      data: {
        userId: authUser.id,
        action: 'REQUEST_SUPERADMIN_REVIEW',
        entityType: 'feedback',
        entityId: feedbackId,
        details: message
          ? `Requested superadmin review with note: ${message}`
          : 'Requested superadmin review',
      },
    });

    if (message) {
      await db.feedbackComment.create({
        data: {
          feedbackId,
          userId: authUser.id,
          comment: message,
          isInternal: true,
        },
      });
    }

    const superAdmins = await db.user.findMany({
      where: { role: 'SUPERADMIN', isActive: true },
      select: { id: true },
    });

    await Promise.all(
      superAdmins.map((sa) =>
        db.notification.create({
          data: {
            userId: sa.id,
            type: 'SUPERADMIN_REVIEW',
            title: 'Review vendor resolution',
            message: `Feedback #${feedbackId} requires superadmin approval`,
            relatedEntityType: 'FEEDBACK',
            relatedEntityId: feedbackId,
          },
        })
      )
    );

    return corsResponse(
      { message: 'Sent for superadmin review', vendor_status: updated.vendorStatus },
      { request, status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
