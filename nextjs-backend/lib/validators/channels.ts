import { z } from 'zod';

// Create channel request
export const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  channel_type: z.string().max(50).optional().default('general'),
  is_private: z.boolean().optional().default(false),
});

export type CreateChannelRequest = z.infer<typeof createChannelSchema>;

// Update channel request
export const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  channel_type: z.string().max(50).optional(),
  is_private: z.boolean().optional(),
});

export type UpdateChannelRequest = z.infer<typeof updateChannelSchema>;

const AttachmentSchema = z.array(z.number().int().positive()).optional();

export const sendChannelMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  is_announcement: z.boolean().optional().default(false),
  attachments: AttachmentSchema,
});

export type SendChannelMessageRequest = z.infer<typeof sendChannelMessageSchema>;

export const pinChannelMessageSchema = z.object({
  is_pinned: z.boolean(),
});

export type PinChannelMessageRequest = z.infer<typeof pinChannelMessageSchema>;

// Channel response
export interface ChannelResponse {
  id: number;
  name: string;
  description: string | null;
  channel_type: string;
  is_private: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

// Channel with creator info
export interface ChannelWithCreatorResponse extends ChannelResponse {
  creator: {
    id: number;
    email: string;
    full_name: string;
  };
}
