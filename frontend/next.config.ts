import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    webpackBuildWorker: false,
    optimizeCss: true,
    optimizePackageImports: ["lucide-react", "@heroicons/react"],
  },

  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              chunks: "all",
              priority: 10,
              name: "vendor",
            },
            common: {
              minChunks: 2,
              chunks: "all",
              priority: 5,
              name: "common",
            },
          },
        },
      };
    }

    // Development optimizations
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: "named",
        chunkIds: "named",
        splitChunks: {
          cacheGroups: {
            default: false,
            vendors: false,
          },
        },
      };

      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }

    return config;
  },

  // Output configuration
  output: "standalone",

  // Image optimization
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },

  // Configure headers for performance
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
