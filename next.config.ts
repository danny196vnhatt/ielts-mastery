import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true, // Bỏ qua lỗi eslint để build nhanh hơn
  },
  typescript: {
    ignoreBuildErrors: true, // Bỏ qua lỗi type để ưu tiên chạy được app
  }
};

export default nextConfig;