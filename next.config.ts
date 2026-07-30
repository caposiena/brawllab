import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/brawllab",
  assetPrefix: "/brawllab/",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
