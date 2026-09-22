/** @type {import('next').NextConfig} */
const nextConfig = {
  // Los tests de flujo levantan su propio dev server: con el mismo directorio de
  // build competiría por el lock de `next dev` con el del desarrollador.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
