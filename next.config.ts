import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expose uniquement les variables publiques côté client
  // Les variables serveur (DATABASE_*) sont automatiquement disponibles côté serveur
  env: {
    API_KEY: process.env.API_KEY,
  },
  // Configuration pour Docker
  output: 'standalone',
};

export default nextConfig;
