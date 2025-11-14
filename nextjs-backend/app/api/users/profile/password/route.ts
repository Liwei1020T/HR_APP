import { NextRequest } from 'next/server';
import { requireAuth, verifyPassword, hashPassword } from '@/lib/auth';
import { db } from '@/lib/db';
import { changePasswordSchema } from '@/lib/validators/users';
import { handleApiError, handleForbiddenError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const validated = changePasswordSchema.parse(body);

    const user = await db.user.findUnique({
      where: { id: authUser.id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const validCurrent = await verifyPassword(validated.current_password, user.password);
    if (!validCurrent) {
      return handleForbiddenError('Current password is incorrect');
    }

    const hashed = await hashPassword(validated.new_password);

    await db.user.update({
      where: { id: authUser.id },
      data: { password: hashed },
    });

    return corsResponse({ message: 'Password updated successfully' }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
