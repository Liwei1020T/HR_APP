import { NextRequest } from 'next/server';
import { requireAuth, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateFeedbackSchema } from '@/lib/validators/feedback';
import { formatDate } from '@/lib/utils';
import { handleApiError, handleNotFoundError, handleForbiddenError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { getAttachmentsByEntity, AttachmentResponse } from '@/lib/files';
import { computeSlaStatus, getAllowedCategoriesForUser, computeSlaMeta } from '../route';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireAuth(request);
    const feedbackId = parseInt(params.id);

    const feedback = await db.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        submitter: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        assignee: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    if (!feedback) {
      return handleNotFoundError('Feedback');
    }

    // Access control:
    // - Submitter can view
    // - HR/Admin can view only if assigned to them
    // - Vendor can view if assigned to vendor
    // - Superadmin can view all
    if (feedback.submittedBy !== authUser.id) {
      if (authUser.role === 'SUPERADMIN') {
        // allowed
      } else if (authUser.role === 'HR' || authUser.role === 'ADMIN') {
        const assignedToSelf = feedback.assignedTo === authUser.id;
        if (!assignedToSelf) {
          return handleForbiddenError('Access denied');
        }
      } else if (authUser.role === 'VENDOR') {
        if (feedback.vendorAssignedTo !== authUser.id) {
          return handleForbiddenError('Access denied');
        }
      } else {
        return handleForbiddenError('Access denied');
      }
    }

    const slaMeta = computeSlaMeta(feedback);
    const vendorSlaStatus = (() => {
      if (!feedback.vendorDueAt) return 'NORMAL';
      const now = new Date();
      const due = feedback.vendorDueAt instanceof Date ? feedback.vendorDueAt : new Date(feedback.vendorDueAt);
      if (now > due && feedback.vendorStatus !== 'APPROVED' && feedback.vendorStatus !== 'REJECTED') return 'BREACHED';
      return 'NORMAL';
    })();

    const response = {
      id: feedback.id,
      title: feedback.title,
      description: feedback.description,
      category: feedback.category,
      status: feedback.status,
      priority: feedback.priority,
      sla_status: slaMeta.status,
      sla_seconds_to_breach: slaMeta.seconds_to_breach,
      sla_seconds_since_breach: slaMeta.seconds_since_breach,
      vendor_sla_status: vendorSlaStatus,
      is_vendor_related: feedback.isVendorRelated,
      vendor_status: feedback.vendorStatus,
      vendor_due_at: feedback.vendorDueAt ? feedback.vendorDueAt.toISOString() : null,
      vendor_last_response_at: feedback.vendorLastResponseAt ? feedback.vendorLastResponseAt.toISOString() : null,
      vendor_assigned_to: feedback.vendorAssignedTo,
      is_anonymous: feedback.isAnonymous,
      submitted_by: feedback.submittedBy,
      submitted_by_name: feedback.isAnonymous && authUser.id !== feedback.submittedBy ? undefined : feedback.submitter.fullName,
      assigned_to: feedback.assignedTo,
      assigned_to_name: feedback.assignee ? feedback.assignee.fullName : undefined,
      created_at: formatDate(feedback.createdAt),
      updated_at: formatDate(feedback.updatedAt),
      ai_analysis: feedback.aiAnalysis,
      submitter: feedback.isAnonymous && authUser.id !== feedback.submittedBy ? null : {
        id: feedback.submitter.id,
        email: feedback.submitter.email,
        full_name: feedback.submitter.fullName,
      },
      assignee: feedback.assignee ? {
        id: feedback.assignee.id,
        email: feedback.assignee.email,
        full_name: feedback.assignee.fullName,
      } : null,
      attachments: [] as AttachmentResponse[],
    };

    const attachments = (await getAttachmentsByEntity('feedback', [feedback.id]))[feedback.id] || [];
    response.attachments = attachments;

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
    const authUser = await requireAuth(request);
    const feedbackId = parseInt(params.id);
    const body = await request.json();
    const validated = updateFeedbackSchema.parse(body);

    const feedback = await db.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      return handleNotFoundError('Feedback');
    }

    // Only submitter can update (and only if not resolved/closed)
    if (feedback.submittedBy !== authUser.id) {
      return handleForbiddenError('Only submitter can update');
    }

    if (feedback.status === 'RESOLVED' || feedback.status === 'CLOSED') {
      return handleForbiddenError('Cannot update resolved or closed feedback');
    }

    const updated = await db.feedback.update({
      where: { id: feedbackId },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.description && { description: validated.description }),
        ...(validated.category && { category: validated.category }),
      },
    });

    const response = {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      category: updated.category,
      status: updated.status,
      is_anonymous: updated.isAnonymous,
      submitted_by: updated.submittedBy,
      assigned_to: updated.assignedTo,
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
    const authUser = await requireAuth(request);
    const feedbackId = parseInt(params.id);

    const feedback = await db.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      return handleNotFoundError('Feedback');
    }

    // Only submitter or ADMIN+ can delete
    if (feedback.submittedBy !== authUser.id && !hasRole(authUser, 'ADMIN')) {
      return handleForbiddenError('Insufficient permissions');
    }

    await db.feedback.delete({
      where: { id: feedbackId },
    });

    return corsResponse({ message: 'Feedback deleted successfully' }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
