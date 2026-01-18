/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/ML-Interview',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
