import { z } from 'zod';

// Login request
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginRequest = z.infer<typeof loginSchema>;

// Refresh token request
export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;

// Register request
export const registerSchema = z
  .object({
    employee_id: z.string().min(1, 'Employee ID is required'),
    full_name: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(6, 'Confirm password is required'),
    department: z.string().optional(),
    date_of_birth: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export type RegisterRequest = z.infer<typeof registerSchema>;

// Token response
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Access token response (refresh endpoint)
export interface AccessTokenResponse {
  access_token: string;
  token_type: string;
}
