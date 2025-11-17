import { z } from 'zod';

// Prisma uses strings for enums in this project (SQLite),
// so we define enum-like unions here instead of importing from @prisma/client.
export const FEEDBACK_CATEGORIES = [
  'GENERAL',
  'WORKPLACE',
  'MANAGEMENT',
  'BENEFITS',
  'CULTURE',
  'OTHER',
] as const;

export const FEEDBACK_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
] as const;

export type FeedbackCategory = typeof FEEDBACK_CATEGORIES[number];
export type FeedbackStatus = typeof FEEDBACK_STATUSES[number];

const CategorySchema = z.enum(FEEDBACK_CATEGORIES);
const StatusSchema = z.enum(FEEDBACK_STATUSES);
const AttachmentSchema = z.array(z.number().int().positive()).optional();

// Create feedback request
export const createFeedbackSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  category: CategorySchema.optional().default('GENERAL'),
  is_anonymous: z.boolean().optional().default(false),
  attachments: AttachmentSchema,
});

export type CreateFeedbackRequest = z.infer<typeof createFeedbackSchema>;

// Update feedback request
export const updateFeedbackSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  category: CategorySchema.optional(),
});

export type UpdateFeedbackRequest = z.infer<typeof updateFeedbackSchema>;

// Update feedback status request
export const updateFeedbackStatusSchema = z.object({
  status: StatusSchema,
  assigned_to: z.number().int().positive().optional(),
});

export type UpdateFeedbackStatusRequest = z.infer<typeof updateFeedbackStatusSchema>;

// Add comment request
export const addCommentSchema = z.object({
  comment: z.string().min(1),
  is_internal: z.boolean().optional().default(false),
  attachments: AttachmentSchema,
});

export type AddCommentRequest = z.infer<typeof addCommentSchema>;

// Feedback response
export interface FeedbackResponse {
  id: number;
  title: string;
  description: string;
  category: FeedbackCategory;
  status: FeedbackStatus;
  is_anonymous: boolean;
  submitted_by: number;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
}

// Feedback with submitter
export interface FeedbackWithSubmitterResponse extends FeedbackResponse {
  submitter: {
    id: number;
    email: string;
    full_name: string;
  } | null; // null if anonymous
  assignee: {
    id: number;
    email: string;
    full_name: string;
  } | null;
}

// Comment response
export interface CommentResponse {
  id: number;
  feedback_id: number;
  user_id: number;
  comment: string;
  is_internal: boolean;
  created_at: string;
  user: {
    id: number;
    email: string;
    full_name: string;
  };
}
