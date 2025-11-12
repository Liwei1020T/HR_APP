import { z } from 'zod';

// SQLite schema stores enums as strings; define local string unions
export const ANNOUNCEMENT_CATEGORIES = [
  'COMPANY_NEWS',
  'HR_POLICY',
  'EVENT',
  'BENEFIT',
  'TRAINING',
  'OTHER',
] as const;

export type AnnouncementCategory = typeof ANNOUNCEMENT_CATEGORIES[number];
const CategorySchema = z.enum(ANNOUNCEMENT_CATEGORIES);

// Create announcement request
export const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  category: CategorySchema.optional().default('OTHER'),
  is_pinned: z.boolean().optional().default(false),
  // Allow ISO strings; keep optional
  expires_at: z.string().datetime().optional(),
});

export type CreateAnnouncementRequest = z.infer<typeof createAnnouncementSchema>;

// Update announcement request
export const updateAnnouncementSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  category: CategorySchema.optional(),
  is_pinned: z.boolean().optional(),
  is_active: z.boolean().optional(),
  expires_at: z.string().datetime().optional().nullable(),
});

export type UpdateAnnouncementRequest = z.infer<typeof updateAnnouncementSchema>;

// Announcement response
export interface AnnouncementResponse {
  id: number;
  title: string;
  content: string;
  category: AnnouncementCategory;
  is_pinned: boolean;
  is_active: boolean;
  expires_at: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// Announcement with creator
export interface AnnouncementWithCreatorResponse extends AnnouncementResponse {
  creator: {
    id: number;
    email: string;
    full_name: string;
  };
}

// Announcement stats
export interface AnnouncementStatsResponse {
  total: number;
  active: number;
  pinned: number;
  by_category: Record<AnnouncementCategory, number>;
}
