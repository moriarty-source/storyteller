import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling native/serverless modules — they must run in Node.js
  serverExternalPackages: ["better-sqlite3", "@neondatabase/serverless"],
};

export default nextConfig;
