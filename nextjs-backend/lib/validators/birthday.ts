import { z } from 'zod';

export const createBirthdayEventSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  event_date: z.string().datetime(),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  location: z.string().max(255).optional(),
});

export type CreateBirthdayEventRequest = z.infer<typeof createBirthdayEventSchema>;

export const birthdayRsvpSchema = z.object({
  rsvp_status: z.enum(['going', 'not_going']),
});

export type BirthdayRsvpRequest = z.infer<typeof birthdayRsvpSchema>;
