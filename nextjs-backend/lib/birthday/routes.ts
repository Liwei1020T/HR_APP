import { NextRequest } from 'next/server';
import { requireAuth, requireRole, hasRole } from '@/lib/auth';
import { corsResponse } from '@/lib/cors';
import { handleApiError, handleNotFoundError, handleForbiddenError } from '@/lib/errors';
import {
  createOrUpdateBirthdayEvent,
  getBirthdayEventById,
  getBirthdayRegistrations,
  listBirthdayEvents,
  updateBirthdayRsvp,
} from './service';
import { createBirthdayEventSchema, birthdayRsvpSchema } from '@/lib/validators/birthday';

export async function listBirthdayEventsRoute(request: NextRequest) {
  try {
    await requireRole(request, 'HR');
    const events = await listBirthdayEvents();
    return corsResponse({ events }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function createBirthdayEventRoute(request: NextRequest) {
  try {
    const authUser = await requireRole(request, 'HR');
    const payload = await request.json();
    const validated = createBirthdayEventSchema.parse(payload);

    const event = await createOrUpdateBirthdayEvent(
      {
        year: validated.year,
        month: validated.month,
        event_date: validated.event_date,
        title: validated.title,
        description: validated.description,
        location: validated.location,
      },
      authUser.id
    );

    return corsResponse(event, { request, status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function getBirthdayEventRoute(
  request: NextRequest,
  eventId: number
) {
  try {
    const authUser = await requireAuth(request);
    const event = await getBirthdayEventById(eventId, authUser.id);

    if (!event) {
      return handleNotFoundError('Birthday event');
    }

    const viewerIsAdmin = hasRole(authUser, 'HR');
    const viewerIsRegistrant = !!event.viewer_registration;

    if (!viewerIsAdmin && !viewerIsRegistrant) {
      return handleForbiddenError();
    }

    return corsResponse(event, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function listBirthdayRegistrationsRoute(
  request: NextRequest,
  eventId: number
) {
  try {
    await requireRole(request, 'HR');
    const registrations = await getBirthdayRegistrations(eventId);
    return corsResponse({ registrations }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function submitBirthdayRsvpRoute(
  request: NextRequest,
  eventId: number
) {
  try {
    const authUser = await requireAuth(request);
    const payload = await request.json();
    const validated = birthdayRsvpSchema.parse(payload);

    const updated = await updateBirthdayRsvp(eventId, authUser.id, validated.rsvp_status);
    return corsResponse(updated, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
