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

# Désactiver la telémétrie Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Note: Les secrets (DATABASE_PASSWORD, JWT_*) ne sont PAS nécessaires au build
# Ils ne sont utilisés que à runtime. Ne pas les passer en ARG/ENV pour des raisons de sécurité.

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
