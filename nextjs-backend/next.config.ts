import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // API-only mode - no pages
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Use Node.js runtime for full compatibility
  serverRuntimeConfig: {
    runtime: 'nodejs',
  },
  // Disable image optimization (not needed for API)
  images: {
    unoptimized: true,
  },
  // API routes only
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

export default nextConfig;
