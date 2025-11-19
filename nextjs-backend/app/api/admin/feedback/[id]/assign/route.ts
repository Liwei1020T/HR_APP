import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { assignFeedbackSchema } from '@/lib/validators/admin';
import { handleApiError, handleNotFoundError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { sendFeedbackNotification } from '@/lib/mail';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, 'HR');
    const feedbackId = parseInt(params.id);
    const body = await request.json();
    const validated = assignFeedbackSchema.parse(body);

    const feedback = await db.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      return handleNotFoundError('Feedback');
    }

    const assignee = await db.user.findUnique({
      where: { id: validated.assigned_to },
    });

    if (!assignee) {
      return handleNotFoundError('Assignee user');
    }

    const updated = await db.feedback.update({
      where: { id: feedbackId },
      data: {
        assignedTo: validated.assigned_to,
        status: 'UNDER_REVIEW',
      },
    });

    // Send notification to assignee
    await db.notification.create({
      data: {
        userId: assignee.id,
        type: 'FEEDBACK',
        title: 'Feedback Assigned',
        message: `Feedback "${feedback.title}" assigned to you`,
        relatedEntityType: 'feedback',
        relatedEntityId: feedback.id,
      },
    });

    // Send email
    await sendFeedbackNotification(
      assignee.email,
      assignee.fullName,
      feedback.title,
      feedback.id
    );

    return corsResponse(
      {
        message: 'Feedback assigned successfully',
        feedback: {
          id: updated.id,
          title: updated.title,
          assigned_to: updated.assignedTo,
          status: updated.status,
        },
      },
      { request, status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
