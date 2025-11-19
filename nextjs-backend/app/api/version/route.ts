import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    version: '2.0.0',
    api: 'Next.js',
    environment: process.env.NODE_ENV || 'development',
  });
}
