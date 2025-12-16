import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['pino', 'thread-stream', 'prisma', '@prisma/client'],
};

export default nextConfig;
