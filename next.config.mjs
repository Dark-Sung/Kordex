/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Las fotos viajan dentro de los formularios (máximo 4 MB cada una).
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
