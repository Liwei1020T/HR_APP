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
  // Webpack configuration for path aliases
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/lib/auth': './lib/auth',
      '@/lib/db': './lib/db',
      '@/lib/utils': './lib/utils',
      '@/lib/errors': './lib/errors',
      '@/lib/cors': './lib/cors',
      '@/lib/storage': './lib/storage',
      '@/lib/mail': './lib/mail',
    };
    return config;
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
