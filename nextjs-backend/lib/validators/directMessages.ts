import { z } from 'zod';

const AttachmentSchema = z.array(z.number().int().positive()).optional();

export const startDirectConversationSchema = z.object({
  target_user_id: z.number().int().positive(),
  topic: z.string().min(1).max(100).optional(),
});

export type StartDirectConversationRequest = z.infer<typeof startDirectConversationSchema>;

export const sendDirectMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  attachments: AttachmentSchema,
});

export type SendDirectMessageRequest = z.infer<typeof sendDirectMessageSchema>;

export const markDirectConversationReadSchema = z.object({
  last_read_message_id: z.number().int().positive().nullable().optional(),
});

export type MarkDirectConversationReadRequest = z.infer<typeof markDirectConversationReadSchema>;
