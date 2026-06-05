import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This app lives inside a larger monorepo; pin the tracing root to itself so
  // Next doesn't pick up a parent lockfile when bundling for deploy.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
