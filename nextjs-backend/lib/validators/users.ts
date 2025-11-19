import { z } from 'zod';
import { UserRole } from '../auth';

// User response
export interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  department: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Update profile request
export const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(255).optional(),
  department: z.string().max(100).optional(),
  date_of_birth: z.string().optional(),
});

export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1),
    new_password: z.string().min(6),
    confirm_password: z.string().min(6),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;

// Update user by admin request
export const updateUserByAdminSchema = z.object({
  full_name: z.string().min(1).max(255).optional(),
  department: z.string().max(100).optional(),
  role: z.enum(['EMPLOYEE', 'HR', 'ADMIN', 'SUPERADMIN']).optional(),
  is_active: z.boolean().optional(),
});

export type UpdateUserByAdminRequest = z.infer<typeof updateUserByAdminSchema>;

// Update user role request (admin)
export const updateUserRoleSchema = z.object({
  role: z.enum(['EMPLOYEE', 'HR', 'ADMIN', 'SUPERADMIN']),
});

export type UpdateUserRoleRequest = z.infer<typeof updateUserRoleSchema>;

// Update user status request (admin)
export const updateUserStatusSchema = z.object({
  is_active: z.boolean(),
});

export type UpdateUserStatusRequest = z.infer<typeof updateUserStatusSchema>;
