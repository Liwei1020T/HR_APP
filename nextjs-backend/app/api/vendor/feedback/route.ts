import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { formatDate } from '@/lib/utils';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    const vendorUser = await requireRole(request, 'VENDOR');

    const feedback = await db.feedback.findMany({
      where: { vendorAssignedTo: vendorUser.id },
      include: {
        submitter: {
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
      priority: f.priority,
      vendor_status: f.vendorStatus,
      vendor_due_at: f.vendorDueAt ? f.vendorDueAt.toISOString() : null,
      vendor_last_response_at: f.vendorLastResponseAt ? f.vendorLastResponseAt.toISOString() : null,
      created_at: formatDate(f.createdAt),
      updated_at: formatDate(f.updatedAt),
      submitted_by_name: f.isAnonymous ? undefined : f.submitter.fullName,
    }));

    return corsResponse({ feedback: formatted }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
