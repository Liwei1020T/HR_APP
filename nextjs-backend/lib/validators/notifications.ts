import { z } from 'zod';

// Notification type
export type NotificationType = 
  | 'FEEDBACK_SUBMITTED'
  | 'FEEDBACK_ASSIGNED'
  | 'FEEDBACK_STATUS_CHANGED'
  | 'FEEDBACK_COMMENT'
  | 'CHANNEL_INVITATION'
  | 'ANNOUNCEMENT'
  | 'SYSTEM';

// Notification response
export interface NotificationResponse {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  related_entity_type: string | null;
  related_entity_id: number | null;
  created_at: string;
}

// Notification stats response
export interface NotificationStatsResponse {
  total: number;
  unread: number;
  by_type: Record<NotificationType, number>;
}

// Mark as read request
export const markAsReadSchema = z.object({
  notification_ids: z.array(z.number().int().positive()).min(1),
});

export type MarkAsReadRequest = z.infer<typeof markAsReadSchema>;
