/** @type {import('next').NextConfig} */
const nextConfig = {
  // API-only mode - no pages
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
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
