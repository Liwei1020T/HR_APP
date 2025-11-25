import { NextRequest } from 'next/server';
import { requireAuth, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { addCommentSchema } from '@/lib/validators/feedback';
import { handleApiError, handleForbiddenError, handleNotFoundError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { formatDate } from '@/lib/utils';
import { assignFilesToEntity, getAttachmentsByEntity } from '@/lib/files';

const ALLOWED_ROLES = ['HR', 'ADMIN', 'SUPERADMIN', 'VENDOR'];

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

function ensureAllowed(user: any, feedback: any) {
  const role = (user.role || '').toUpperCase();
  if (!ALLOWED_ROLES.includes(role)) {
    throw handleForbiddenError('Not permitted');
  }
  // Vendors can only access if assigned
  if (role === 'VENDOR' && feedback.vendorAssignedTo !== user.id) {
    throw handleForbiddenError('Not permitted');
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await requireAuth(request);
    const feedbackId = parseInt(params.id);

    const feedback = await db.feedback.findUnique({
      where: { id: feedbackId },
      select: { id: true, title: true, vendorAssignedTo: true },
    });

    if (!feedback) return handleNotFoundError('Feedback');

    ensureAllowed(authUser, feedback);

    const comments = await db.feedbackComment.findMany({
      where: {
        feedbackId,
        isInternal: true, // dedicated vendor/admin thread
      },
      include: {
        user: { select: { id: true, email: true, fullName: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const attachmentMap = await getAttachmentsByEntity('feedback_comment', comments.map((c) => c.id));

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
        role: c.user.role,
      },
      attachments: attachmentMap[c.id] || [],
    }));

    return corsResponse({ comments: formatted, total: formatted.length }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await requireAuth(request);
    const feedbackId = parseInt(params.id);
    const body = await request.json();
    const validated = addCommentSchema.parse(body);

    const feedback = await db.feedback.findUnique({
      where: { id: feedbackId },
      select: { id: true, title: true, vendorAssignedTo: true },
    });

    if (!feedback) return handleNotFoundError('Feedback');

    ensureAllowed(authUser, feedback);

    const comment = await db.feedbackComment.create({
      data: {
        feedbackId,
        userId: authUser.id,
        comment: validated.comment,
        isInternal: true,
      },
      include: {
        user: { select: { id: true, email: true, fullName: true, role: true } },
      },
    });

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
        role: comment.user.role,
      },
      attachments,
    };

    return corsResponse(response, { request, status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
