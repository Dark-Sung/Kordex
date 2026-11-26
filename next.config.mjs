/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.KORDEX_STANDALONE === "1" ? { output: "standalone" } : {}),
  reactStrictMode: true,
  experimental: {
    // Las fotos viajan dentro de los formularios (máximo 4 MB cada una).
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
