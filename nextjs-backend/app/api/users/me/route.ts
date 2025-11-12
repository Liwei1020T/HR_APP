import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatUserResponse } from '@/lib/utils';
import { updateProfileSchema } from '@/lib/validators/users';
import { handleApiError, createErrorResponse } from '@/lib/errors';
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
      return createErrorResponse('User not found', 404);
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
        ...(validated.department !== undefined && { department: validated.department }),
      },
    });

    return corsResponse(formatUserResponse(updated), { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
