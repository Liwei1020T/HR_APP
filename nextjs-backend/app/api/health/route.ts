import { NextResponse } from 'next/server';

type HealthResponse = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  timestamp: string;
};

const baseHealth: Omit<HealthResponse, 'timestamp'> = {
  status: 'healthy',
  service: 'HR App API',
};

const buildHealthPayload = (): HealthResponse => ({
  ...baseHealth,
  timestamp: new Date().toISOString(),
});

export const GET = () => NextResponse.json(buildHealthPayload());
