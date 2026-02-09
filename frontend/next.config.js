/** @type {import('next').NextConfig} */
const isWindows = process.platform === 'win32';
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Windows dev machines can hit spawn EPERM during type-check workers.
    // Keep CI behavior unchanged (Linux) while allowing local builds to finish.
    ignoreBuildErrors: isWindows,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
