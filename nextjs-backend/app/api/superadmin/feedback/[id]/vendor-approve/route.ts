import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleApiError, handleNotFoundError, handleForbiddenError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const superAdmin = await requireRole(request, 'SUPERADMIN');
    const feedbackId = parseInt(params.id);
    const body = await request.json();
    const actionRaw = (body.action || '').toUpperCase();
    const comment: string = (body.comment || '').trim();

    if (!['APPROVE', 'REJECT'].includes(actionRaw)) {
      return handleForbiddenError('Invalid action');
    }

    const action = actionRaw === 'REJECT' ? 'REJECTED' : 'APPROVED';

    const feedback = await db.feedback.findUnique({ where: { id: feedbackId } });
    if (!feedback) return handleNotFoundError('Feedback');
    if (feedback.vendorStatus !== 'VENDOR_REPLIED' && feedback.vendorStatus !== 'AWAITING_SUPERADMIN') {
      return handleForbiddenError('Not awaiting superadmin decision');
    }

    const updated = await db.feedback.update({
      where: { id: feedbackId },
      data: {
        vendorStatus: action,
        vendorLastResponseAt: new Date(),
      },
    });

    if (comment) {
      await db.feedbackComment.create({
        data: {
          feedbackId,
          userId: superAdmin.id,
          comment,
          isInternal: true,
        },
      });
    }

    return corsResponse({ message: `Vendor response ${action.toLowerCase()}`, vendor_status: updated.vendorStatus }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
