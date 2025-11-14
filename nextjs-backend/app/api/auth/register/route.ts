import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { registerSchema } from '@/lib/validators/auth';
import { handleApiError, handleConflictError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    const normalizedEmail = validated.email.toLowerCase();

    const existingEmail = await db.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      return handleConflictError('Email already registered');
    }

    const existingEmployeeId = await db.user.findFirst({
      where: { employeeId: validated.employee_id },
    });
    if (existingEmployeeId) {
      return handleConflictError('Employee ID already registered');
    }

    const hashedPassword = await hashPassword(validated.password);

    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        fullName: validated.full_name,
        employeeId: validated.employee_id,
        department: validated.department || null,
        dateOfBirth: validated.date_of_birth ? new Date(validated.date_of_birth) : null,
        role: 'EMPLOYEE',
        isActive: true,
      },
    });

    return corsResponse(
      {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
      },
      { request, status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
