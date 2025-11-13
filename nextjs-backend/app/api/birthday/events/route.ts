import { NextRequest } from 'next/server';
import { handleCorsPreflightRequest } from '@/lib/cors';
import {
  listBirthdayEventsRoute,
  createBirthdayEventRoute,
} from '@/lib/birthday/routes';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(request: NextRequest) {
  return listBirthdayEventsRoute(request);
}

export async function POST(request: NextRequest) {
  return createBirthdayEventRoute(request);
}
