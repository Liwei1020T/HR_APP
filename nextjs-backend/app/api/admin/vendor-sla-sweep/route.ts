import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { handleCorsPreflightRequest, corsResponse } from '@/lib/cors';
import { runVendorSlaSweep } from '@/lib/vendor-sla';
import { ensureVendorSlaScheduler } from '@/lib/scheduler';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');
    ensureVendorSlaScheduler();
    const result = await runVendorSlaSweep();
    return corsResponse({ message: 'Vendor SLA sweep completed', ...result }, { request, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
