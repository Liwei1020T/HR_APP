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
    const authUser = await requireRole(request, 'HR');
    const feedbackId = parseInt(params.id);
    const body = await request.json();
    const vendorId = body.vendor_id;
    const dueDays = body.due_days ?? 7;
    const message: string = (body.message || '').trim();

    if (!vendorId) {
      return handleForbiddenError('vendor_id required');
    }
    if (!message) {
      return handleForbiddenError('message required');
    }

    const feedback = await db.feedback.findUnique({ where: { id: feedbackId } });
    if (!feedback) {
      return handleNotFoundError('Feedback');
    }

    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + dueDays);

    const updated = await db.feedback.update({
      where: { id: feedbackId },
      data: {
        vendorAssignedTo: vendorId,
        vendorDueAt: dueAt,
        vendorStatus: 'FORWARDED',
      },
    });

    // Log an internal comment with the instructions sent to the vendor
    await db.feedbackComment.create({
      data: {
        feedbackId,
        userId: authUser.id,
        comment: message,
        isInternal: true,
      },
    });

    return corsResponse(
      { message: 'Forwarded to vendor', vendor_due_at: dueAt, vendor_status: updated.vendorStatus },
      { request, status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
