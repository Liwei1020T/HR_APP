import { z } from 'zod';
import { UserRole } from '../auth';

// System metrics response
export interface SystemMetricsResponse {
  total_users: number;
  active_users: number;
  total_feedback: number;
  pending_feedback: number;
  total_channels: number;
  total_announcements: number;
  users_by_role: Record<UserRole, number>;
}

// User metrics response
export interface UserMetricsResponse {
  total_users: number;
  active_users: number;
  inactive_users: number;
  by_role: Record<UserRole, number>;
  by_department: Record<string, number>;
  recent_signups: Array<{
    id: number;
    email: string;
    full_name: string;
    role: UserRole;
    created_at: string;
  }>;
}

// Assign feedback request
export const assignFeedbackSchema = z.object({
  assigned_to: z.number().int().positive(),
});

export type AssignFeedbackRequest = z.infer<typeof assignFeedbackSchema>;

// Audit log response
export interface AuditLogResponse {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
  user: {
    id: number;
    email: string;
    full_name: string;
  } | null;
}
