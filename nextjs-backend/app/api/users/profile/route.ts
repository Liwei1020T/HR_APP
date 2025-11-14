import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateProfileSchema } from '@/lib/validators/users';
import { formatUserResponse } from '@/lib/utils';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const user = await db.user.findUnique({
      where: { id: authUser.id },
    });
    if (!user) {
      throw new Error('User not found');
    }
    return corsResponse(formatUserResponse(user), { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    const updated = await db.user.update({
      where: { id: authUser.id },
      data: {
        ...(validated.full_name && { fullName: validated.full_name }),
        ...(validated.department !== undefined && { department: validated.department || null }),
        ...(validated.date_of_birth !== undefined && {
          dateOfBirth: validated.date_of_birth ? new Date(validated.date_of_birth) : null,
        }),
      },
    });

    return corsResponse(formatUserResponse(updated), { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
