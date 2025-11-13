import { Prisma } from '@prisma/client';
import { formatDate } from '@/lib/utils';
import {
  BirthdayEventResponse,
  BirthdayRegistrationResponse,
  BirthdayEventSummary,
} from './types';

export type BirthdayEventWithRelations = Prisma.BirthdayEventGetPayload<{
  include: {
    createdBy: true;
    registrations: {
      include: {
        user: true;
      };
    };
  };
}>;

export type BirthdayRegistrationWithUser = Prisma.BirthdayRegistrationGetPayload<{
  include: {
    user: true;
  };
}>;

export function mapBirthdayRegistration(
  registration: BirthdayRegistrationWithUser
): BirthdayRegistrationResponse {
  return {
    id: registration.id,
    event_id: registration.eventId,
    user_id: registration.userId,
    rsvp_status: registration.rsvpStatus as BirthdayRegistrationResponse['rsvp_status'],
    rsvp_at: registration.rsvpAt ? formatDate(registration.rsvpAt) : null,
    created_at: formatDate(registration.createdAt),
    user: registration.user
      ? {
          id: registration.user.id,
          full_name: registration.user.fullName,
          email: registration.user.email,
          department: registration.user.department,
          date_of_birth: registration.user.dateOfBirth
            ? formatDate(registration.user.dateOfBirth)
            : null,
        }
      : undefined,
  };
}

function buildSummary(registrations: BirthdayRegistrationWithUser[]): BirthdayEventSummary {
  return registrations.reduce<BirthdayEventSummary>(
    (acc, registration) => {
      acc.total_registrations += 1;
      if (registration.rsvpStatus === 'going') {
        acc.going_count += 1;
      } else if (registration.rsvpStatus === 'not_going') {
        acc.not_going_count += 1;
      } else {
        acc.pending_count += 1;
      }
      return acc;
    },
    { total_registrations: 0, going_count: 0, pending_count: 0, not_going_count: 0 }
  );
}

export function mapBirthdayEvent(
  event: BirthdayEventWithRelations,
  viewerRegistration?: BirthdayRegistrationWithUser | null
): BirthdayEventResponse {
  const summary = buildSummary(event.registrations);

  return {
    id: event.id,
    year: event.year,
    month: event.month,
    event_date: formatDate(event.eventDate),
    title: event.title,
    description: event.description,
    location: event.location,
    created_by: {
      id: event.createdBy.id,
      full_name: event.createdBy.fullName,
      email: event.createdBy.email,
    },
    created_at: formatDate(event.createdAt),
    updated_at: formatDate(event.updatedAt),
    summary,
    viewer_registration: viewerRegistration
      ? mapBirthdayRegistration(viewerRegistration)
      : undefined,
  };
}
