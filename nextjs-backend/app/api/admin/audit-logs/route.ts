import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatDate, getPaginationParams } from '@/lib/utils';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');
    const { searchParams } = new URL(request.url);
    const { skip, limit } = getPaginationParams(searchParams);

    const logs = await db.auditLog.findMany({
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = logs.map((log) => ({
      id: log.id,
      user_id: log.userId,
      action: log.action,
      entity_type: log.entityType,
      entity_id: log.entityId,
      details: log.details,
      ip_address: log.ipAddress,
      created_at: formatDate(log.createdAt),
      user: log.user ? {
        id: log.user.id,
        email: log.user.email,
        full_name: log.user.fullName,
      } : null,
    }));

    const total = await db.auditLog.count();
    const page = Math.floor(skip / limit) + 1;

    return corsResponse({ 
      logs: formatted, 
      total, 
      page, 
      page_size: limit 
    }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
