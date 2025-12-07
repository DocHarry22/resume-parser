/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features if needed
  experimental: {},
  
  // Configure allowed image domains if needed
  images: {
    domains: [],
  },
  
  // Environment variables available on the client
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  },
};

module.exports = nextConfig;
