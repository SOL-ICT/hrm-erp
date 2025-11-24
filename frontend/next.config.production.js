/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Static export for shared hosting
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },
  env: {
    NEXT_PUBLIC_API_URL: "https://mysol360.com/api",
    NEXT_PUBLIC_APP_URL: "https://mysol360.com",
  },
  assetPrefix: "",
  distDir: "out",
};

module.exports = nextConfig;
