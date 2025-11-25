import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateFeedbackStatusSchema } from '@/lib/validators/feedback';
import { formatDate } from '@/lib/utils';
import { handleApiError, handleNotFoundError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { sendFeedbackNotification } from '@/lib/mail';
import { computeSlaStatus, computeSlaMeta } from '../../route';

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
    const validated = updateFeedbackStatusSchema.parse(body);

    const feedback = await db.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        submitter: true,
      },
    });

    if (!feedback) {
      return handleNotFoundError('Feedback');
    }

    const updated = await db.feedback.update({
      where: { id: feedbackId },
      data: {
        status: validated.status,
        ...(validated.assigned_to && { assignedTo: validated.assigned_to }),
      },
    });

    // Notify submitter about status change
    await db.notification.create({
      data: {
        userId: feedback.submittedBy,
        type: 'FEEDBACK',
        title: 'Feedback Status Updated',
        message: `Your feedback "${feedback.title}" status changed to ${validated.status}`,
        relatedEntityType: 'feedback',
        relatedEntityId: feedback.id,
      },
    });

    // Send email if assigned
    if (validated.assigned_to) {
      const assignee = await db.user.findUnique({
        where: { id: validated.assigned_to },
      });

      if (assignee) {
        await sendFeedbackNotification(
          assignee.email,
          assignee.fullName,
          feedback.title,
          feedback.id
        );

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
      }
    }

    const slaMeta = computeSlaMeta(updated);

    const response = {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      category: updated.category,
      status: updated.status,
      priority: updated.priority,
      sla_status: slaMeta.status,
      sla_seconds_to_breach: slaMeta.seconds_to_breach,
      sla_seconds_since_breach: slaMeta.seconds_since_breach,
      vendor_status: updated.vendorStatus,
      vendor_due_at: updated.vendorDueAt ? updated.vendorDueAt.toISOString() : null,
      vendor_last_response_at: updated.vendorLastResponseAt ? updated.vendorLastResponseAt.toISOString() : null,
      vendor_assigned_to: updated.vendorAssignedTo,
      is_anonymous: updated.isAnonymous,
      submitted_by: updated.submittedBy,
      submitted_by_name: feedback.isAnonymous ? undefined : feedback.submitter.fullName,
      assigned_to: updated.assignedTo,
      assigned_to_name: updated.assignedTo ? (await db.user.findUnique({ where: { id: updated.assignedTo } }))?.fullName : undefined,
      created_at: formatDate(updated.createdAt),
      updated_at: formatDate(updated.updatedAt),
      ai_analysis: updated.aiAnalysis,
    };

    return corsResponse(response, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
