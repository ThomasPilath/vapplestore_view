# Multi-stage build optimisé avec Bun pour Next.js
# Stage 0: Base image avec Bun
FROM oven/bun:1-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Stage 1: Installer les dépendances (cache layer optimisé)
FROM base AS deps

# Copier seulement les fichiers de dépendances pour optimiser le cache
# Si package.json ne change pas, cette layer est réutilisée
COPY package.json bun.lockb* ./

# Bun install est ~10x plus rapide que npm (1-2s au lieu de 10-20s)
RUN bun install --frozen-lockfile

# Stage 2: Builder l'application avec Bun
FROM base AS builder
WORKDIR /app

# Désactiver la telémétrie Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Note: Les secrets (DATABASE_PASSWORD, JWT_*) ne sont PAS nécessaires au build
# Ils ne sont utilisés que à runtime. Ne pas les passer en ARG/ENV pour des raisons de sécurité.

# Copier les dépendances depuis le stage deps (réutilisé si package.json n'a pas changé)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copier seulement les fichiers source nécessaires
COPY app ./app
COPY components ./components
COPY hook ./hook
COPY lib ./lib
COPY public ./public
COPY types ./types
COPY next.config.ts tsconfig.json ./
COPY postcss.config.mjs eslint.config.mjs ./
COPY components.json ./

# Build Next.js avec Bun (utilise le runtime Bun, plus rapide)
RUN bun run build

# Stage 3: Image de production minimale avec Node.js
# Note: On utilise Node pour le runtime car Next.js standalone utilise Node
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copier uniquement les fichiers nécessaires à l'exécution
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Basculer vers l'utilisateur non-root
USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
