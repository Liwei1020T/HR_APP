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
    const vendorUser = await requireRole(request, 'VENDOR');
    const feedbackId = parseInt(params.id);
    const body = await request.json();
    const replyText = body.reply;

    const feedback = await db.feedback.findUnique({ where: { id: feedbackId } });
    if (!feedback) return handleNotFoundError('Feedback');
    if (feedback.vendorAssignedTo !== vendorUser.id) {
      return handleForbiddenError('Not assigned to you');
    }

    await db.feedback.update({
      where: { id: feedbackId },
      data: {
        vendorLastResponseAt: new Date(),
        vendorStatus: 'VENDOR_REPLIED',
      },
    });

    const hasReply = replyText && replyText.trim().length > 0;

    if (hasReply) {
      await db.feedbackComment.create({
        data: {
          feedbackId,
          userId: vendorUser.id,
          comment: replyText,
          isInternal: true,
        },
      });
    }

    // Notify superadmins that vendor replied
    const superAdmins = await db.user.findMany({
      where: { role: 'SUPERADMIN', isActive: true },
      select: { id: true },
    });

    await Promise.all(
      superAdmins.map((sa) =>
        db.notification.create({
          data: {
            userId: sa.id,
            type: 'VENDOR_REPLY',
            title: 'Vendor replied',
            message: `Vendor responded on feedback #${feedbackId}`,
            relatedEntityType: 'FEEDBACK',
            relatedEntityId: feedbackId,
          },
        })
      )
    );

    return corsResponse({ message: 'Reply submitted' }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
