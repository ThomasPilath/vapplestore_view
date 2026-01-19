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
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
# Copy build artifacts from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json /app/package-lock.json* ./
# Copy public files if they exist, otherwise create empty public dir
RUN mkdir -p ./public
COPY --from=builder /app/public/ ./public/ 2>/dev/null || true
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "run", "start"]
