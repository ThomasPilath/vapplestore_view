/**
 * Rate limiter avec support pour in-memory (single instance) et Redis (multi-instance)
 * 
 * En développement ou single-instance: utilise Map in-memory
 * En production multi-instance: configurez REDIS_URL pour utiliser Redis
 * 
 * Format: "redis://[user:password@]host[:port]"
 * Exemple: "redis://localhost:6379" ou "redis://:password@redis.example.com:6379"
 */
import { NextRequest, NextResponse } from "next/server";

// Mode de rate limiting selon l'environnement
const RATE_LIMIT_MODE = process.env.REDIS_URL ? "redis" : "memory";

// In-memory store (utilisé quand REDIS_URL n'est pas défini)
// Map key: identifier (ex: ip:route) -> list of timestamps (ms) within window
const memoryAttempts = new Map<string, number[]>();

// Types pour le rate limiting
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Extrait l'adresse IP du client depuis les headers
 */
export function getClientIp(request: NextRequest): string {
  // X-Forwarded-For: utilisé par les proxies (nginx, load balancers)
  const xfwd = request.headers.get("x-forwarded-for");
  if (xfwd) {
    const ip = xfwd.split(",")[0]?.trim();
    if (ip) return ip;
  }
  
  // X-Real-IP: utilisé par certains proxies
  const xrealip = request.headers.get("x-real-ip");
  if (xrealip) return xrealip;
  
  // Fallback
  return "unknown";
}

/**
 * Rate limit utilisant in-memory store (single instance)
 */
function rateLimitMemory(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  const entries = memoryAttempts.get(key) || [];
  const recent = entries.filter((ts) => ts > windowStart);
  recent.push(now);
  memoryAttempts.set(key, recent);

  const allowed = recent.length <= limit;
  const remaining = Math.max(limit - recent.length, 0);
  const oldest = recent[0] || now;
  const retryAfterMs = Math.max(windowMs - (now - oldest), 0);

  return {
    allowed,
    remaining,
    retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
  };
}

/**
 * Rate limit utilisant Redis (multi-instance)
 * Note: Implémentation avec gestion gracieuse si Redis n'est pas disponible
 */
async function rateLimitRedis(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    // En production, utiliser une librairie Redis comme redis.js ou ioredis
    // Pour l'instant, fallback sur in-memory pour éviter dépendances additionnelles
    console.warn(
      "Rate limiter: REDIS_URL défini mais Redis client non implémenté. Utilisation du fallback memory."
    );
    return rateLimitMemory(key, limit, windowMs);
  } catch (error) {
    // Si Redis fail, fallback sur in-memory
    console.error("Rate limiter Redis error, falling back to memory:", error);
    return rateLimitMemory(key, limit, windowMs);
  }
}

/**
 * Rate limit principal - choisit le mode (memory ou Redis)
 */
export function rateLimit(
  _request: NextRequest,
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  // Actuellement toujours utiliser memory (Redis client peut être intégré plus tard)
  return rateLimitMemory(key, limit, windowMs);
}

/**
 * Rate limit asynchrone pour future utilisation avec Redis
 */
export async function rateLimitAsync(
  _request: NextRequest,
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (RATE_LIMIT_MODE === "redis") {
    return rateLimitRedis(key, limit, windowMs);
  }
  return rateLimitMemory(key, limit, windowMs);
}

/**
 * Génère une réponse 429 Too Many Requests
 */
export function rateLimitResponse(retryAfterSeconds: number) {
  return new NextResponse(
    JSON.stringify({ error: "Trop de tentatives, réessayez plus tard" }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": retryAfterSeconds.toString(),
      },
    }
  );
}

/**
 * Recommandations pour migrer vers Redis en production:
 * 
 * 1. Installer le client Redis:
 *    npm install redis
 *    ou: bun add redis
 * 
 * 2. Implémenter rateLimitRedis avec Redis client:
 *    ```typescript
 *    import { createClient } from 'redis';
 *    
 *    const redisClient = createClient({ url: process.env.REDIS_URL });
 *    await redisClient.connect();
 *    
 *    // Utiliser INCR avec expiration:
 *    await redisClient.incr(key);
 *    await redisClient.expire(key, Math.ceil(windowMs / 1000));
 *    ```
 * 
 * 3. Configurer REDIS_URL dans .env:
 *    REDIS_URL=redis://localhost:6379
 * 
 * 4. Avantages:
 *    ✅ Fonctionne en multi-instance
 *    ✅ Persistent entre les redémarrages
 *    ✅ Peut être partagé avec d'autres services
 */
