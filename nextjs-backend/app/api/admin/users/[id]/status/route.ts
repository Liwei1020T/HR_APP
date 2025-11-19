import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateUserStatusSchema } from '@/lib/validators/users';
import { formatUserResponse } from '@/lib/utils';
import { handleApiError, handleNotFoundError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const userId = parseInt(params.id);
    const body = await request.json();
    const validated = updateUserStatusSchema.parse(body);

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return handleNotFoundError('User');
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: {
        isActive: validated.is_active,
      },
    });

    return corsResponse(formatUserResponse(updated), { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
