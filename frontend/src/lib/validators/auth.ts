import { z } from 'zod';

export const registerSchema = z
  .object({
    employee_id: z.string().min(1, 'Employee ID is required'),
    full_name: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(6, 'Please confirm your password'),
    department: z.string().optional(),
    date_of_birth: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords must match',
    path: ['confirm_password'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
