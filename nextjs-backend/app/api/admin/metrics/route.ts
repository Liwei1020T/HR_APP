import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');

    const totalUsers = await db.user.count();
    const activeUsers = await db.user.count({ where: { isActive: true } });
    const totalFeedback = await db.feedback.count();
    const pendingFeedback = await db.feedback.count({ where: { status: 'SUBMITTED' } });
    const totalChannels = await db.channel.count();
    const totalAnnouncements = await db.announcement.count();

    const usersByRole = await db.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    const usersByRoleFormatted: Record<string, number> = {};
    usersByRole.forEach((item) => {
      usersByRoleFormatted[item.role] = item._count.role;
    });

    const response = {
      total_users: totalUsers,
      active_users: activeUsers,
      total_feedback: totalFeedback,
      pending_feedback: pendingFeedback,
      total_channels: totalChannels,
      total_announcements: totalAnnouncements,
      users_by_role: usersByRoleFormatted,
    };

    return corsResponse(response, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
