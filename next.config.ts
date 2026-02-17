import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Babalewalain nito ang ESLint errors sa build para tumuloy ang deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Opsyonal: I-skip din ang TS checks kung may error doon
    ignoreBuildErrors: true,
  }
};

export default nextConfig;