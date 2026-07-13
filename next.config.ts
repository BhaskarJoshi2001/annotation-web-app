import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // standalone output is only for the Docker/EC2 build; Vercel manages its own output
  ...(process.env.BUILD_STANDALONE === 'true' ? { output: 'standalone' as const } : {}),
  serverExternalPackages: ['canvas'],
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

export default nextConfig;
