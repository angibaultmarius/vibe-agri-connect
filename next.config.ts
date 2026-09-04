import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Les photos sont servies via des URL signées Supabase Storage.
  images: { remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }] },
};

export default nextConfig;
