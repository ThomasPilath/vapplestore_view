import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expose uniquement les variables publiques côté client
  // Les variables serveur (DATABASE_*) sont automatiquement disponibles côté serveur
  env: {
    API_KEY: process.env.API_KEY,
  },
  // Configuration pour Docker
  output: 'standalone',
  
  // Security Headers (complément au middleware.ts)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
