import { z } from 'zod';

// Channel member role type
export type MemberRole = 'MEMBER' | 'MODERATOR';

// Join channel request
export const joinChannelSchema = z.object({
  channel_id: z.number().int().positive(),
});

export type JoinChannelRequest = z.infer<typeof joinChannelSchema>;

// Leave channel request
export const leaveChannelSchema = z.object({
  channel_id: z.number().int().positive(),
});

export type LeaveChannelRequest = z.infer<typeof leaveChannelSchema>;

// Membership response
export interface MembershipResponse {
  id: number;
  user_id: number;
  channel_id: number;
  role: MemberRole;
  joined_at: string;
}

// Membership with user info
export interface MembershipWithUserResponse extends MembershipResponse {
  user: {
    id: number;
    email: string;
    full_name: string;
    role: string;
  };
}

// Membership with channel info
export interface MembershipWithChannelResponse extends MembershipResponse {
  channel: {
    id: number;
    name: string;
    description: string | null;
    channel_type: string;
  };
}
