# Multi-stage build for Next.js app
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
RUN apk add --no-cache libc6-compat \
  && npm install -g npm@latest
COPY package.json package-lock.json* ./
RUN npm install

FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Build args for environment variables needed at build time
ARG API_KEY
ARG DATABASE_HOST
ARG DATABASE_PORT
ARG DATABASE_NAME
ARG DATABASE_USER
ARG DATABASE_PASSWORD
ARG JWT_ACCESS_SECRET
ARG JWT_REFRESH_SECRET
ARG ALLOWED_ORIGINS

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV API_KEY=${API_KEY}
ENV DATABASE_HOST=${DATABASE_HOST}
ENV DATABASE_PORT=${DATABASE_PORT}
ENV DATABASE_NAME=${DATABASE_NAME}
ENV DATABASE_USER=${DATABASE_USER}
ENV DATABASE_PASSWORD=${DATABASE_PASSWORD}
ENV JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
ENV JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
ENV ALLOWED_ORIGINS=${ALLOWED_ORIGINS}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build Next.js avec optimisation standalone
RUN npm run build
# Ensure public directory exists
RUN mkdir -p /app/public

FROM base AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy standalone build (optimized for Docker)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Basculer vers l'utilisateur non-root
USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
