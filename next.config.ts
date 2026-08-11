import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // In production on Vercel, vercel.json routes /api to api/index.py
    // In local development, proxy /api requests to local Uvicorn FastAPI server on port 8000
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://127.0.0.1:8000/api/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
