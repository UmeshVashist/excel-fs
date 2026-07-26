/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/board",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
