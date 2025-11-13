import { db } from '@/lib/db';
import { mapBirthdayEvent, mapBirthdayRegistration, BirthdayEventWithRelations } from './models';
import {
  BirthdayEventResponse,
  BirthdayRegistrationResponse,
  CreateBirthdayEventInput,
  RsvpStatus,
} from './types';

export async function getBirthdayUsersForMonth(_year: number, month: number) {
  const users = await db.user.findMany({
    where: {
      isActive: true,
      dateOfBirth: {
        not: null,
      },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      department: true,
      dateOfBirth: true,
    },
  });

  return users.filter((user) => {
    if (!user.dateOfBirth) return false;
    return user.dateOfBirth.getUTCMonth() + 1 === month;
  });
}

async function loadEventWithRelations(eventId: number) {
  const event = await db.birthdayEvent.findUnique({
    where: { id: eventId },
    include: {
      createdBy: true,
      registrations: {
        include: {
          user: true,
        },
      },
    },
  });

  return event;
}

export async function createOrUpdateBirthdayEvent(
  payload: CreateBirthdayEventInput,
  createdById: number
): Promise<BirthdayEventResponse> {
  const eventDate = new Date(payload.event_date);
  if (Number.isNaN(eventDate.getTime())) {
    throw new Error('Invalid event_date provided');
  }

  const eligibleUsers = await getBirthdayUsersForMonth(payload.year, payload.month);

  const result = await db.$transaction(async (tx) => {
    const existing = await tx.birthdayEvent.findFirst({
      where: { year: payload.year, month: payload.month },
      include: {
        createdBy: true,
        registrations: { include: { user: true } },
      },
    });

    let event: BirthdayEventWithRelations;
    if (existing) {
      event = await tx.birthdayEvent.update({
        where: { id: existing.id },
        data: {
          eventDate,
          title: payload.title,
          description: payload.description,
          location: payload.location,
        },
        include: {
          createdBy: true,
          registrations: { include: { user: true } },
        },
      });
    } else {
      event = await tx.birthdayEvent.create({
        data: {
          year: payload.year,
          month: payload.month,
          eventDate,
          title: payload.title,
          description: payload.description,
          location: payload.location,
          createdById,
        },
        include: {
          createdBy: true,
          registrations: { include: { user: true } },
        },
      });
    }

    const eligibleIds = new Set(eligibleUsers.map((user) => user.id));
    const existingRegistrations = await tx.birthdayRegistration.findMany({
      where: { eventId: event.id },
    });

    const registrationsToDelete = existingRegistrations
      .filter((registration) => !eligibleIds.has(registration.userId))
      .map((registration) => registration.id);

    if (registrationsToDelete.length > 0) {
      await tx.birthdayRegistration.deleteMany({
        where: { id: { in: registrationsToDelete } },
      });
    }

    const existingRegistrationUserIds = new Set(
      existingRegistrations.map((registration) => registration.userId)
    );

    const newRegistrationData = eligibleUsers
      .filter((user) => !existingRegistrationUserIds.has(user.id))
      .map((user) => ({
        eventId: event.id,
        userId: user.id,
      }));

    if (newRegistrationData.length > 0) {
      await tx.birthdayRegistration.createMany({
        data: newRegistrationData,
      });
    }

    const updatedEvent = await tx.birthdayEvent.findUnique({
      where: { id: event.id },
      include: {
        createdBy: true,
        registrations: { include: { user: true } },
      },
    });

    return {
      event: updatedEvent!,
      notifiedUserIds: newRegistrationData.map((registration) => registration.userId),
    };
  });

  if (result.notifiedUserIds.length > 0) {
    await Promise.all(
      result.notifiedUserIds.map((userId) =>
        db.notification.create({
          data: {
            userId,
            type: 'birthday_invite',
            title: 'Birthday Celebration',
            message: "You are invited to this month's birthday celebration.",
            relatedEntityType: 'birthday_invite',
            relatedEntityId: result.event.id,
          },
        })
      )
    );
  }

  return mapBirthdayEvent(result.event);
}

export async function listBirthdayEvents(): Promise<BirthdayEventResponse[]> {
  const events = await db.birthdayEvent.findMany({
    orderBy: { eventDate: 'desc' },
    include: {
      createdBy: true,
      registrations: { include: { user: true } },
    },
  });

  return events.map((event) => mapBirthdayEvent(event));
}

export async function getBirthdayEventById(
  eventId: number,
  viewerId?: number
): Promise<BirthdayEventResponse | null> {
  const event = await loadEventWithRelations(eventId);
  if (!event) {
    return null;
  }

  const viewerRegistration = viewerId
    ? event.registrations.find((registration) => registration.userId === viewerId)
    : undefined;

  return mapBirthdayEvent(event, viewerRegistration);
}

export async function getBirthdayRegistrations(
  eventId: number
): Promise<BirthdayRegistrationResponse[]> {
  const registrations = await db.birthdayRegistration.findMany({
    where: { eventId },
    include: {
      user: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return registrations.map((registration) => mapBirthdayRegistration(registration));
}

export async function updateBirthdayRsvp(
  eventId: number,
  userId: number,
  rsvpStatus: Exclude<RsvpStatus, 'pending'>
): Promise<BirthdayRegistrationResponse> {
  const registration = await db.birthdayRegistration.findFirst({
    where: { eventId, userId },
    include: { user: true },
  });

  if (!registration) {
    throw new Error('Registration not found for this event');
  }

  const updated = await db.birthdayRegistration.update({
    where: { id: registration.id },
    data: {
      rsvpStatus,
      rsvpAt: new Date(),
    },
    include: { user: true },
  });

  return mapBirthdayRegistration(updated);
}
