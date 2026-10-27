
/** @type {import('next').NextConfig} */

const nextConfig = {
  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d1ssr5uvl3uuv0.cloudfront.net",
        pathname: "/uat-woohoo/**",
      },
      {
        protocol: "https",
        hostname: "stage.woohoo.in",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
