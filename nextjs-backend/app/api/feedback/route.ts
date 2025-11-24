import { NextRequest } from 'next/server';
import { requireAuth, hasRole, UserRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { createFeedbackSchema } from '@/lib/validators/feedback';
import { formatDate, getPaginationParams, parseQueryBoolean } from '@/lib/utils';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { assignFilesToEntity, getAttachmentsByEntity } from '@/lib/files';
import { analyzeFeedback } from '@/lib/ai';

// Preferred assignee roles per category (fallback order applied when no direct match)
const CATEGORY_ASSIGNEE_ROLES: Record<string, UserRole[]> = {
  WORKPLACE: ['HR', 'ADMIN', 'SUPERADMIN'],
  MANAGEMENT: ['ADMIN', 'HR', 'SUPERADMIN'],
  BENEFITS: ['HR', 'ADMIN', 'SUPERADMIN'],
  CULTURE: ['HR', 'ADMIN', 'SUPERADMIN'],
  GENERAL: ['HR', 'ADMIN', 'SUPERADMIN'],
  OTHER: ['HR', 'ADMIN', 'SUPERADMIN'],
};

export async function findAssigneeForCategory(category: string) {
  const roles = CATEGORY_ASSIGNEE_ROLES[category] || CATEGORY_ASSIGNEE_ROLES.GENERAL;

  for (const role of roles) {
    const user = await db.user.findFirst({
      where: { role, isActive: true },
      orderBy: { id: 'asc' }, // deterministic selection
    });

    if (user) {
      return { id: user.id, fullName: user.fullName, email: user.email };
    }
  }

  return null;
}

const URGENT_SLA_HOURS = parseInt(process.env.URGENT_SLA_HOURS || '12', 10);
const UNDER_REVIEW_SLA_DAYS = parseInt(process.env.UNDER_REVIEW_SLA_DAYS || '3', 10);

export function computeSlaStatus(feedback: any) {
  const now = new Date();
  const createdAt = feedback.createdAt instanceof Date ? feedback.createdAt : new Date(feedback.createdAt);
  const updatedAt = feedback.updatedAt instanceof Date ? feedback.updatedAt : new Date(feedback.updatedAt);

  // URGENT stuck in SUBMITTED
  if (feedback.priority === 'URGENT' && feedback.status === 'SUBMITTED') {
    const hoursSinceCreate = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreate >= URGENT_SLA_HOURS) {
      return 'BREACHED';
    }
  }

  // UNDER_REVIEW stale
  if (feedback.status === 'UNDER_REVIEW') {
    const daysSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate >= UNDER_REVIEW_SLA_DAYS) {
      return 'WARNING';
    }
  }

  return 'NORMAL';
}

export function computeSlaMeta(feedback: any) {
  const status = computeSlaStatus(feedback);
  const now = new Date();
  const createdAt = feedback.createdAt instanceof Date ? feedback.createdAt : new Date(feedback.createdAt);
  const updatedAt = feedback.updatedAt instanceof Date ? feedback.updatedAt : new Date(feedback.updatedAt);

  if (feedback.priority === 'URGENT' && feedback.status === 'SUBMITTED') {
    const elapsedSeconds = (now.getTime() - createdAt.getTime()) / 1000;
    const limitSeconds = URGENT_SLA_HOURS * 3600;
    return {
      status,
      seconds_to_breach: status === 'BREACHED' ? 0 : Math.max(0, Math.round(limitSeconds - elapsedSeconds)),
      seconds_since_breach: status === 'BREACHED' ? Math.round(elapsedSeconds - limitSeconds) : 0,
    };
  }

  if (feedback.status === 'UNDER_REVIEW') {
    const elapsedSeconds = (now.getTime() - updatedAt.getTime()) / 1000;
    const limitSeconds = UNDER_REVIEW_SLA_DAYS * 24 * 3600;
    return {
      status,
      seconds_to_breach: status === 'WARNING' ? 0 : Math.max(0, Math.round(limitSeconds - elapsedSeconds)),
      seconds_since_breach: status === 'WARNING' ? Math.round(elapsedSeconds - limitSeconds) : 0,
    };
  }

  return { status, seconds_to_breach: null, seconds_since_breach: null };
}

// Map departments to visible categories (fallback to assignment if none match)
const DEPARTMENT_CATEGORY_MAP: Record<string, string[]> = {
  FACILITY: ['WORKPLACE', 'OTHER'],
  FACILITIES: ['WORKPLACE', 'OTHER'],
  HR: ['GENERAL', 'BENEFITS', 'CULTURE', 'MANAGEMENT'],
  HUMAN_RESOURCES: ['GENERAL', 'BENEFITS', 'CULTURE', 'MANAGEMENT'],
  IT: ['WORKPLACE', 'MANAGEMENT', 'OTHER'],
  ENGINEERING: ['WORKPLACE', 'MANAGEMENT', 'OTHER'],
  OPERATIONS: ['WORKPLACE', 'GENERAL', 'OTHER'],
  MANAGEMENT: ['MANAGEMENT', 'GENERAL'],
};

export function getAllowedCategoriesForUser(department?: string | null) {
  if (!department) return [];
  const key = department.replace(/\s+/g, '_').toUpperCase();
  return DEPARTMENT_CATEGORY_MAP[key] || [];
}

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
    const priorityFilter = searchParams.get('priority');
    const myFeedback = parseQueryBoolean(searchParams.get('my_feedback'));
    const myAssigned = parseQueryBoolean(searchParams.get('my_assigned'));
    const search = searchParams.get('q');
    const assignedFilter = searchParams.get('assigned'); // "assigned" | "unassigned"
    const slaFilter = searchParams.get('sla'); // "NORMAL" | "WARNING" | "BREACHED"

    const where: any = {};
    const orConditions: any[] = [];

    // Filter by status
    if (statusFilter) {
      where.status = statusFilter;
    }

    // Filter by category
    if (categoryFilter) {
      where.category = categoryFilter;
    }

    // Filter by priority
    if (priorityFilter) {
      where.priority = priorityFilter;
    }

    // Search in title/description
    if (search) {
      orConditions.push(
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      );
    }

    // Assigned/unassigned filter
    if (assignedFilter === 'assigned') {
      where.assignedTo = { not: null };
    } else if (assignedFilter === 'unassigned') {
      where.assignedTo = null;
    }

    // Filter by current user's feedback
    if (myFeedback) {
      where.submittedBy = authUser.id;
    } else if (myAssigned) {
      where.assignedTo = authUser.id;
    } else if (authUser.role === 'HR' || authUser.role === 'ADMIN') {
      // HR/Admin see only items assigned to themselves (unless my_feedback/my_assigned already applied)
      where.assignedTo = authUser.id;
    } else if (!hasRole(authUser, 'HR')) {
      // Regular employees only see their own feedback
      where.submittedBy = authUser.id;
    }

    if (orConditions.length) {
      where.OR = orConditions;
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

    let formatted = feedback.map((f) => {
      const slaMeta = computeSlaMeta(f);
      return ({
      id: f.id,
      title: f.title,
      description: f.description,
      category: f.category,
      status: f.status,
      priority: f.priority,
      ai_analysis: f.aiAnalysis,
      sla_status: slaMeta.status,
      sla_seconds_to_breach: slaMeta.seconds_to_breach,
      sla_seconds_since_breach: slaMeta.seconds_since_breach,
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
    })});

    if (slaFilter) {
      formatted = formatted.filter((f) => {
        if (slaFilter === 'AT_RISK') {
          return f.sla_status === 'WARNING' || f.sla_status === 'BREACHED';
        }
        return f.sla_status === slaFilter;
      });
    }

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

    // Debug logging
    console.log('=== FEEDBACK SUBMISSION DEBUG ===');
    console.log('Request body:', JSON.stringify(body, null, 2));

    let validated;
    try {
      validated = createFeedbackSchema.parse(body);
      console.log('Validated data:', JSON.stringify(validated, null, 2));
    } catch (validationError: any) {
      console.error('Validation Error Details:');
      console.error('Error type:', validationError.constructor.name);
      console.error('Full error:', JSON.stringify(validationError, null, 2));
      if (validationError.errors) {
        console.error('Zod errors:', JSON.stringify(validationError.errors, null, 2));
      }
      throw validationError;
    }


    // Analyze feedback with AI
    const aiResult = await analyzeFeedback(validated.title, validated.description);
    const resolvedCategory = (aiResult.category || validated.category || 'GENERAL').toUpperCase();

    // Auto-assign to the best matching admin/HR based on detected category
    const autoAssignee = await findAssigneeForCategory(resolvedCategory);

    const feedback = await db.feedback.create({
      data: {
        title: validated.title,
        description: validated.description,
        category: resolvedCategory, // AI-driven category
        isAnonymous: validated.is_anonymous || false,
        status: 'SUBMITTED',
        priority: aiResult.priority, // Added priority
        aiAnalysis: aiResult.analysis, // Added aiAnalysis
        submittedBy: authUser.id,
        assignedTo: autoAssignee?.id || null,
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

    // Notify the chosen assignee (or fallback to all HR/Admin/Superadmin)
    const hrUsers = await db.user.findMany({
      where: {
        role: { in: ['HR', 'ADMIN', 'SUPERADMIN'] },
        isActive: true,
      },
    });

    const notificationTargets = autoAssignee
      ? hrUsers.filter((u) => u.id === autoAssignee.id)
      : hrUsers;

    for (const hrUser of notificationTargets) {
      const isUrgent = aiResult.priority === 'URGENT'; // Added urgency check
      await db.notification.create({
        data: {
          userId: hrUser.id,
          type: 'FEEDBACK',
          title: isUrgent ? '🚨 URGENT FEEDBACK RECEIVED' : 'New Feedback Submitted', // Updated title
          message: autoAssignee
            ? `AI auto-assigned: ${validated.title} (Priority: ${aiResult.priority})`
            : isUrgent
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
      assigned_to_name: autoAssignee?.fullName,
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
