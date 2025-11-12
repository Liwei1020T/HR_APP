import { NextRequest } from 'next/server';
import { requireAuth, requireRole, hasRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { createFeedbackSchema } from '@/lib/validators/feedback';
import { formatDate, getPaginationParams, parseQueryBoolean } from '@/lib/utils';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

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

    const formatted = feedback.map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      category: f.category,
      status: f.status,
      is_anonymous: f.isAnonymous,
      submitted_by: f.submittedBy,
      assigned_to: f.assignedTo,
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
    }));

    return corsResponse(formatted, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const validated = createFeedbackSchema.parse(body);

    const feedback = await db.feedback.create({
      data: {
        title: validated.title,
        description: validated.description,
        category: validated.category || 'GENERAL',
        isAnonymous: validated.is_anonymous || false,
        status: 'SUBMITTED',
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

    // Create notification for HR team
    const hrUsers = await db.user.findMany({
      where: {
        role: { in: ['HR', 'ADMIN', 'SUPERADMIN'] },
        isActive: true,
      },
    });

    for (const hrUser of hrUsers) {
      await db.notification.create({
        data: {
          userId: hrUser.id,
          type: 'FEEDBACK',
          title: 'New Feedback Submitted',
          message: `New feedback: ${validated.title}`,
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
      is_anonymous: feedback.isAnonymous,
      submitted_by: feedback.submittedBy,
      assigned_to: feedback.assignedTo,
      created_at: formatDate(feedback.createdAt),
      updated_at: formatDate(feedback.updatedAt),
      submitter: feedback.isAnonymous ? null : {
        id: feedback.submitter.id,
        email: feedback.submitter.email,
        full_name: feedback.submitter.fullName,
      },
      assignee: null,
    };

    return corsResponse(response, { request, status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
