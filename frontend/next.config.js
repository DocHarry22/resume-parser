/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || (process.env.STATIC_EXPORT === '1' ? '.next-sites' : '.next'),
  ...(process.env.STATIC_EXPORT === '1' ? { output: 'export', trailingSlash: true, images: { unoptimized: true } } : {}),
  // Enable experimental features if needed
  experimental: {},
  
  // Configure allowed image domains if needed
  
  poweredByHeader: false,
  outputFileTracingRoot: __dirname,
  async rewrites() {
    if (process.env.STATIC_EXPORT === '1') return [];
    const backend = (process.env.API_PROXY_TARGET || 'http://127.0.0.1:8000').replace(/\/+$/, '');
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }];
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ] }];
  },
};

module.exports = nextConfig;
