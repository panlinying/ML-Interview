/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

// Only use static export for production builds
const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true'

const nextConfig = {
  ...(isStaticExport && { output: 'export' }),
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
