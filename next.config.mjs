/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
    turbo: false, // 🚫 desactiva Turbopack
  },
  // No ocultar errores de TypeScript en build
  images: {
    unoptimized: true,
  },
}

export default nextConfig
