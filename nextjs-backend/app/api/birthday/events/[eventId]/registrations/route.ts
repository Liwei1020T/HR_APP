import { NextRequest } from 'next/server';
import { handleCorsPreflightRequest } from '@/lib/cors';
import { handleApiError } from '@/lib/errors';
import { listBirthdayRegistrationsRoute } from '@/lib/birthday/routes';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = parseInt(params.eventId, 10);
    if (Number.isNaN(eventId)) {
      throw new Error('Invalid event id');
    }

    return await listBirthdayRegistrationsRoute(request, eventId);
  } catch (error) {
    return handleApiError(error);
  }
}
