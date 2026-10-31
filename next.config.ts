import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /* Static HTML for Hostinger hPanel / public_html upload */
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
