import { NextRequest } from 'next/server';
import { requireAuth, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateFeedbackSchema } from '@/lib/validators/feedback';
import { formatDate } from '@/lib/utils';
import { handleApiError, handleNotFoundError, handleForbiddenError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

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

    // Access control: only submitter or HR+ can view
    if (feedback.submittedBy !== authUser.id && !hasRole(authUser, 'HR')) {
      return handleForbiddenError('Access denied');
    }

    const response = {
      id: feedback.id,
      title: feedback.title,
      description: feedback.description,
      category: feedback.category,
      status: feedback.status,
      is_anonymous: feedback.isAnonymous,
      submitted_by: feedback.submittedBy,
      assigned_to: feedback.assignedTo,
      created_at: formatDate(feedback.createdAt),
      updated_at: formatDate(feedback.updatedAt),
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
