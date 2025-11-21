import { User } from '@prisma/client';

/**
 * Format User model to UserResponse
 */
export function formatUserResponse(user: User) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    role: user.role,
    department: user.department,
    employee_id: user.employeeId,
    date_of_birth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null,
    is_active: user.isActive,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

/**
 * Format Date to ISO string
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Parse query parameter to number
 */
export function parseQueryNumber(value: string | null, defaultValue: number = 0): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse query parameter to boolean
 */
export function parseQueryBoolean(value: string | null, defaultValue: boolean = false): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Get pagination params from query
 */
export function getPaginationParams(searchParams: URLSearchParams) {
  const skip = parseQueryNumber(searchParams.get('skip'), 0);
  const limit = parseQueryNumber(searchParams.get('limit'), 50);

  return { skip, limit: Math.min(limit, 100) }; // Cap at 100
}

/**
 * Build deterministic key for direct conversation participants
 */
export function buildDirectConversationKey(userIds: number[]): string {
  return userIds.sort((a, b) => a - b).join(':');
}
