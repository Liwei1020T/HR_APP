import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';

    const users = await db.user.findMany({
      where: {
        isActive: true,
        id: { not: authUser.id },
        ...(q
          ? {
              OR: [
                { fullName: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { employeeId: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        department: true,
        role: true,
      },
      orderBy: { fullName: 'asc' },
      take: 50,
    });

    const formatted = users.map((user) => ({
      id: user.id,
      full_name: user.fullName,
      email: user.email,
      department: user.department,
      role: user.role,
    }));

    return corsResponse({ users: formatted }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
