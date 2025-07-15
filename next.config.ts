import type { NextConfig } from "next";
import { join } from "path";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ensure uploaded files are copied to the output directory
  output: 'standalone',
  // Configure static file serving
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      }
    ]
  },
  // Serve uploaded files from the correct directory
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Exclude problematic Windows system directories
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules',
        '**/.next',
        '**/C:/Users/**/Application Data',
        '**/C:/Users/**/AppData',
        '**/C:/ProgramData',
        '**/C:/Windows',
        '**/C:/Users/**/Local Settings',
        '**/C:/Users/**/Application Data/**',
        '**/C:/Users/**/AppData/**',
        '**/C:/ProgramData/**',
        '**/C:/Windows/**',
        '**/C:/Users/**/Local Settings/**'
      ]
    };
    
    return config;
  }
};

export default nextConfig;
