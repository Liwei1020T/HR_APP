import { NextRequest } from 'next/server';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function POST(request: NextRequest) {
  // Logout is client-side only (token disposal)
  // Just return success
  return corsResponse({ message: 'Logged out successfully' }, { request, status: 200 });
}
