import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['canvas'],
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

export default nextConfig;
