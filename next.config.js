/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['playwright-core', 'better-sqlite3'],
  },
}

module.exports = nextConfig












