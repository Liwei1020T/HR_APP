import { NextRequest } from 'next/server';
import { requireAuth, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { addCommentSchema } from '@/lib/validators/feedback';
import { formatDate } from '@/lib/utils';
import { handleApiError, handleNotFoundError, handleForbiddenError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { assignFilesToEntity, getAttachmentsByEntity } from '@/lib/files';

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
    });

    if (!feedback) {
      return handleNotFoundError('Feedback');
    }

    // Access control
    if (feedback.submittedBy !== authUser.id && !hasRole(authUser, 'HR')) {
      return handleForbiddenError('Access denied');
    }

    const comments = await db.feedbackComment.findMany({
      where: {
        feedbackId: feedbackId,
        // Hide internal comments from submitter
        ...(feedback.submittedBy === authUser.id && !hasRole(authUser, 'HR') ? { isInternal: false } : {}),
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

    const commentIds = comments.map((c) => c.id);
    const attachmentMap = await getAttachmentsByEntity('feedback_comment', commentIds);

    const formatted = comments.map((c) => ({
      id: c.id,
      feedback_id: c.feedbackId,
      user_id: c.userId,
      comment: c.comment,
      is_internal: c.isInternal,
      created_at: formatDate(c.createdAt),
      user: {
        id: c.user.id,
        email: c.user.email,
        full_name: c.user.fullName,
      },
      attachments: attachmentMap[c.id] || [],
    }));

    const total = comments.length;

    return corsResponse({ comments: formatted, total }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireAuth(request);
    const feedbackId = parseInt(params.id);
    const body = await request.json();
    const validated = addCommentSchema.parse(body);

    const feedback = await db.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      return handleNotFoundError('Feedback');
    }

    // Access control
    if (feedback.submittedBy !== authUser.id && !hasRole(authUser, 'HR')) {
      return handleForbiddenError('Access denied');
    }

    // Only HR+ can create internal comments
    const isInternal = validated.is_internal && hasRole(authUser, 'HR');

    const comment = await db.feedbackComment.create({
      data: {
        feedbackId: feedbackId,
        userId: authUser.id,
        comment: validated.comment,
        isInternal: isInternal,
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
    });

    // Notify feedback submitter (if not internal and commenter is not submitter)
    if (!isInternal && authUser.id !== feedback.submittedBy) {
      await db.notification.create({
        data: {
          userId: feedback.submittedBy,
          type: 'FEEDBACK',
          title: 'New Comment on Your Feedback',
          message: `New comment on "${feedback.title}"`,
          relatedEntityType: 'feedback',
          relatedEntityId: feedback.id,
        },
      });
    }

    const attachmentIds = validated.attachments ?? [];
    if (attachmentIds.length) {
      await assignFilesToEntity({
        attachmentIds,
        userId: authUser.id,
        entity: 'feedback_comment',
        entityId: comment.id,
      });
    }

    const attachments = (await getAttachmentsByEntity('feedback_comment', [comment.id]))[comment.id] || [];

    const response = {
      id: comment.id,
      feedback_id: comment.feedbackId,
      user_id: comment.userId,
      comment: comment.comment,
      is_internal: comment.isInternal,
      created_at: formatDate(comment.createdAt),
      user: {
        id: comment.user.id,
        email: comment.user.email,
        full_name: comment.user.fullName,
      },
      attachments,
    };

    return corsResponse(response, { request, status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
