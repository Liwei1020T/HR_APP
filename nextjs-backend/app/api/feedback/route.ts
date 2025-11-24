import { NextRequest } from 'next/server';
import { requireAuth, requireRole, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { createFeedbackSchema } from '@/lib/validators/feedback';
import { formatDate, getPaginationParams, parseQueryBoolean } from '@/lib/utils';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { assignFilesToEntity, getAttachmentsByEntity } from '@/lib/files';
import { analyzeFeedback } from '@/lib/ai';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const { skip, limit } = getPaginationParams(searchParams);
    const statusFilter = searchParams.get('status');
    const categoryFilter = searchParams.get('category');
    const myFeedback = parseQueryBoolean(searchParams.get('my_feedback'));

    const where: any = {};

    // Filter by status
    if (statusFilter) {
      where.status = statusFilter;
    }

    // Filter by category
    if (categoryFilter) {
      where.category = categoryFilter;
    }

    // Filter by current user's feedback
    if (myFeedback) {
      where.submittedBy = authUser.id;
    } else if (!hasRole(authUser, 'HR')) {
      // Regular employees only see their own feedback
      where.submittedBy = authUser.id;
    }

    const feedback = await db.feedback.findMany({
      where,
      skip,
      take: limit,
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
      orderBy: { createdAt: 'desc' },
    });

    const feedbackIds = feedback.map((f) => f.id);
    const attachmentsByFeedback = await getAttachmentsByEntity('feedback', feedbackIds);

    const formatted = feedback.map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      category: f.category,
      status: f.status,
      priority: f.priority,
      ai_analysis: f.aiAnalysis,
      is_anonymous: f.isAnonymous,
      submitted_by: f.submittedBy,
      submitted_by_name: f.isAnonymous ? undefined : f.submitter.fullName,
      assigned_to: f.assignedTo,
      assigned_to_name: f.assignee ? f.assignee.fullName : undefined,
      created_at: formatDate(f.createdAt),
      updated_at: formatDate(f.updatedAt),
      submitter: f.isAnonymous ? null : {
        id: f.submitter.id,
        email: f.submitter.email,
        full_name: f.submitter.fullName,
      },
      assignee: f.assignee ? {
        id: f.assignee.id,
        email: f.assignee.email,
        full_name: f.assignee.fullName,
      } : null,
      attachments: attachmentsByFeedback[f.id] || [],
    }));

    const total = await db.feedback.count({ where });

    return corsResponse({ feedback: formatted, total }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const validated = createFeedbackSchema.parse(body);

    // Analyze feedback with AI
    const aiResult = await analyzeFeedback(validated.title, validated.description);

    const feedback = await db.feedback.create({
      data: {
        title: validated.title,
        description: validated.description,
        category: aiResult.category || validated.category || 'GENERAL', // Updated category logic
        isAnonymous: validated.is_anonymous || false,
        status: 'SUBMITTED',
        priority: aiResult.priority, // Added priority
        aiAnalysis: aiResult.analysis, // Added aiAnalysis
        submittedBy: authUser.id,
      },
      include: {
        submitter: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    const attachmentIds = validated.attachments ?? [];
    if (attachmentIds.length) {
      await assignFilesToEntity({
        attachmentIds,
        userId: authUser.id,
        entity: 'feedback',
        entityId: feedback.id,
      });
    }

    const attachments = (await getAttachmentsByEntity('feedback', [feedback.id]))[feedback.id] || [];

    // Create notification for HR team
    const hrUsers = await db.user.findMany({
      where: {
        role: { in: ['HR', 'ADMIN', 'SUPERADMIN'] },
        isActive: true,
      },
    });

    for (const hrUser of hrUsers) {
      const isUrgent = aiResult.priority === 'URGENT'; // Added urgency check
      await db.notification.create({
        data: {
          userId: hrUser.id,
          type: 'FEEDBACK',
          title: isUrgent ? '🚨 URGENT FEEDBACK RECEIVED' : 'New Feedback Submitted', // Updated title
          message: isUrgent
            ? `URGENT: ${validated.title} (Priority: ${aiResult.priority})`
            : `New feedback: ${validated.title}`, // Updated message
          relatedEntityType: 'feedback',
          relatedEntityId: feedback.id,
        },
      });
    }

    const response = {
      id: feedback.id,
      title: feedback.title,
      description: feedback.description,
      category: feedback.category,
      status: feedback.status,
      priority: feedback.priority, // Added priority
      ai_analysis: feedback.aiAnalysis, // Added ai_analysis
      is_anonymous: feedback.isAnonymous,
      submitted_by: feedback.submittedBy,
      submitted_by_name: feedback.isAnonymous ? undefined : feedback.submitter.fullName,
      assigned_to: feedback.assignedTo,
      assigned_to_name: null,
      created_at: formatDate(feedback.createdAt),
      updated_at: formatDate(feedback.updatedAt),
      submitter: feedback.isAnonymous ? null : {
        id: feedback.submitter.id,
        email: feedback.submitter.email,
        full_name: feedback.submitter.fullName,
      },
      assignee: null,
      attachments,
    };

    return corsResponse(response, { request, status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
