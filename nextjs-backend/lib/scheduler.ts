import { runVendorSlaSweep } from './vendor-sla';

const HOUR_MS = 60 * 60 * 1000;

export function ensureVendorSlaScheduler() {
  const globalAny = globalThis as any;
  if (globalAny.__vendorSlaInterval) return;

  // Run immediately once on boot, then hourly.
  runVendorSlaSweep().catch((err) => console.error('Vendor SLA sweep (boot) failed', err));

  globalAny.__vendorSlaInterval = setInterval(() => {
    runVendorSlaSweep().catch((err) => console.error('Vendor SLA sweep failed', err));
  }, HOUR_MS);
}
