import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatUserResponse } from '@/lib/utils';
import { updateUserByAdminSchema } from '@/lib/validators/users';
import { handleApiError, handleNotFoundError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, 'HR');

    const user = await db.user.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!user) {
      return handleNotFoundError('User');
    }

    return corsResponse(formatUserResponse(user), { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, 'ADMIN');

    const body = await request.json();
    const validated = updateUserByAdminSchema.parse(body);

    const updateData: any = {};
    if (validated.full_name) updateData.fullName = validated.full_name;
    if (validated.department !== undefined) updateData.department = validated.department;
    if (validated.role) updateData.role = validated.role;
    if (validated.is_active !== undefined) updateData.isActive = validated.is_active;

    const updated = await db.user.update({
      where: { id: parseInt(params.id) },
      data: updateData,
    });

    return corsResponse(formatUserResponse(updated), { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
