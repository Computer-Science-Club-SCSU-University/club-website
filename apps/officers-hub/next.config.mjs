/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@club-website/ui"],
  // Only use standalone for production builds
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // Add webpack config for better hot reload in Docker
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay rebuild after the first change
      };
    }
    return config;
  },
  eslint: { ignoreDuringBuilds: true }
} 

export default nextConfig
