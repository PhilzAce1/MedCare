/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    WEB3AUTH_CLIENT_ID: process.env.WEB3_AUTH_CLIENT_ID,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   typescript: {
//     ignoreBuildErrors: true,
//   },
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
//   env: {
//     DATABASE_URL: process.env.DATABASE_URL,
//     WEB3AUTH_CLIENT_ID: process.env.WEB3_AUTH_CLIENT_ID,
//     GEMINI_API_KEY: process.env.GEMINI_API_KEY,
//   },
// };

// export default nextConfig;
