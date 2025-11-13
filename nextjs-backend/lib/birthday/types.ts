export type RsvpStatus = 'pending' | 'going' | 'not_going';

export interface BirthdayEventSummary {
  total_registrations: number;
  going_count: number;
  pending_count: number;
  not_going_count: number;
}

export interface BirthdayEventResponse {
  id: number;
  year: number;
  month: number;
  event_date: string;
  title: string;
  description?: string | null;
  location?: string | null;
  created_by: {
    id: number;
    full_name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  summary: BirthdayEventSummary;
  viewer_registration?: BirthdayRegistrationResponse | null;
}

export interface BirthdayRegistrationResponse {
  id: number;
  event_id: number;
  user_id: number;
  rsvp_status: RsvpStatus;
  rsvp_at: string | null;
  created_at: string;
  user?: {
    id: number;
    full_name: string;
    email: string;
    department?: string | null;
    date_of_birth?: string | null;
  };
}

export interface CreateBirthdayEventInput {
  year: number;
  month: number;
  event_date: string;
  title: string;
  description?: string | null;
  location?: string | null;
}

export interface BirthdayRsvpInput {
  rsvp_status: Exclude<RsvpStatus, 'pending'>;
}
