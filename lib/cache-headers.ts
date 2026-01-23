/**
 * Cache Headers Utilities
 * 
 * Aide à implémenter un caching approprié pour les réponses API et assets
 * Utilise les HTTP Cache-Control headers pour optimiser les performances
 */

import { NextResponse } from "next/server";

/**
 * Types de caching
 */
export const CacheStrategy = {
  // Pas de cache - toujours revalider (authentification, données sensibles)
  NO_CACHE: "no-cache, no-store, must-revalidate",
  
  // Cache privé - peut être mis en cache par le client/navigateur
  // Utilisé pour les données utilisateur personnalisées
  PRIVATE_SHORT: "private, max-age=300", // 5 minutes
  PRIVATE_MEDIUM: "private, max-age=3600", // 1 hour
  PRIVATE_LONG: "private, max-age=86400", // 1 day
  
  // Cache publique - peut être mis en cache par les proxies/CDNs
  // Utilisé pour les données publiques statiques
  PUBLIC_SHORT: "public, max-age=60", // 1 minute
  PUBLIC_MEDIUM: "public, max-age=300", // 5 minutes
  PUBLIC_LONG: "public, max-age=3600", // 1 hour
  PUBLIC_VERY_LONG: "public, max-age=86400", // 1 day
  
  // Stale-While-Revalidate - sert la version en cache même si expirée
  // pendant qu'on revalide en arrière-plan
  STALE_WHILE_REVALIDATE: "public, max-age=60, stale-while-revalidate=300",
};

/**
 * Ajouter cache headers à une réponse
 */
export function withCacheHeaders(
  response: NextResponse,
  strategy: string = CacheStrategy.NO_CACHE
): NextResponse {
  response.headers.set("Cache-Control", strategy);
  response.headers.set("Pragma", strategy === CacheStrategy.NO_CACHE ? "no-cache" : "");
  return response;
}

/**
 * Shorthand pour réponses sans cache (données sensibles/authentifiées)
 */
export function withNoCache(response: NextResponse): NextResponse {
  return withCacheHeaders(response, CacheStrategy.NO_CACHE);
}

/**
 * Shorthand pour réponses cachées court terme (données dynamiques)
 */
export function withShortCache(response: NextResponse, isPrivate = true): NextResponse {
  const strategy = isPrivate ? CacheStrategy.PRIVATE_SHORT : CacheStrategy.PUBLIC_SHORT;
  return withCacheHeaders(response, strategy);
}

/**
 * Shorthand pour réponses cachées long terme (assets statiques)
 */
export function withLongCache(response: NextResponse, isPrivate = false): NextResponse {
  const strategy = isPrivate ? CacheStrategy.PRIVATE_LONG : CacheStrategy.PUBLIC_LONG;
  return withCacheHeaders(response, strategy);
}

/**
 * Exemple d'utilisation dans une route API:
 * 
 * export async function GET(req: NextRequest) {
 *   const data = await fetchData();
 *   
 *   const response = successResponse(data);
 *   
 *   // Cache 1 heure publiquement
 *   return withCacheHeaders(response, CacheStrategy.PUBLIC_MEDIUM);
 * }
 * 
 * Pour les données authentifiées:
 * 
 * export async function GET(req: NextRequest) {
 *   const user = authenticate(req);
 *   if (!user) return unauthorizedResponse();
 *   
 *   const userData = await fetchUserData(user.id);
 *   const response = successResponse(userData);
 *   
 *   // Cache 5 minutes privé (utilisateur seulement)
 *   return withCacheHeaders(response, CacheStrategy.PRIVATE_SHORT);
 * }
 * 
 * Pour les données publiques statiques:
 * 
 * export async function GET() {
 *   const data = await fetchStaticData();
 *   const response = successResponse(data);
 *   
 *   // Cache 1 jour avec revalidation
 *   return withCacheHeaders(response, CacheStrategy.STALE_WHILE_REVALIDATE);
 * }
 */

/**
 * Headers de caching recommandés par endpoint
 */
export const RECOMMENDED_CACHE_STRATEGY = {
  // Authentification - JAMAIS cacher
  "/api/auth/login": CacheStrategy.NO_CACHE,
  "/api/auth/logout": CacheStrategy.NO_CACHE,
  "/api/auth/refresh": CacheStrategy.NO_CACHE,
  "/api/auth/me": CacheStrategy.NO_CACHE,
  
  // Données utilisateur - Cache court privé
  "/api/user/settings": CacheStrategy.PRIVATE_SHORT,
  "/api/admin/users": CacheStrategy.NO_CACHE, // Données sensibles
  
  // Données métier - Cache court privé
  "/api/purchases": CacheStrategy.PRIVATE_SHORT, // 5 min
  "/api/revenues": CacheStrategy.PRIVATE_SHORT, // 5 min
  
  // Audit - Cache court privé (sensible)
  "/api/audit": CacheStrategy.NO_CACHE,
  
  // Health checks - Cache très court
  "/api/db-check": CacheStrategy.PUBLIC_SHORT, // 1 min
  
  // Assets statiques - Cache long (voir next.config.ts)
  "/api/assets": CacheStrategy.PUBLIC_VERY_LONG, // 1 day
};

export default {
  CacheStrategy,
  withCacheHeaders,
  withNoCache,
  withShortCache,
  withLongCache,
  RECOMMENDED_CACHE_STRATEGY,
};
