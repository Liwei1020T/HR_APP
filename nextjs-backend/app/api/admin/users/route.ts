import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatUserResponse } from '@/lib/utils';
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
    const inactiveUsers = await db.user.count({ where: { isActive: false } });

    const byRole = await db.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    const byRoleFormatted: Record<string, number> = {};
    byRole.forEach((item) => {
      byRoleFormatted[item.role] = item._count.role;
    });

    // Group by department
    const users = await db.user.findMany();
    const byDepartment: Record<string, number> = {};
    users.forEach((user) => {
      const dept = user.department || 'Unassigned';
      byDepartment[dept] = (byDepartment[dept] || 0) + 1;
    });

    // Recent signups (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSignups = await db.user.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const response = {
      total_users: totalUsers,
      active_users: activeUsers,
      inactive_users: inactiveUsers,
      by_role: byRoleFormatted,
      by_department: byDepartment,
      recent_signups: recentSignups.map(formatUserResponse),
    };

    return corsResponse(response, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
