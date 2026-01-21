/**
 * Middleware pour protéger les routes API
 */

import { NextRequest } from "next/server";
import { verifyAccessToken, extractTokenFromHeader, TokenPayload } from "@/lib/auth";

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload;
}

/**
 * Vérifie l'authentification et retourne les infos utilisateur
 * Retourne null si non authentifié
 */
export function authenticate(request: NextRequest): TokenPayload | null {
  const authHeader = request.headers.get("Authorization");
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    return null;
  }
  
  const payload = verifyAccessToken(token);
  return payload;
}

/**
 * Vérifie que l'utilisateur a le niveau de rôle requis
 */
export function hasRequiredLevel(user: TokenPayload | null, requiredLevel: number): boolean {
  if (!user) return false;
  return user.roleLevel >= requiredLevel;
}

/**
 * Erreur standardisée pour authentification échouée
 */
export function unauthorizedResponse(message: string = "Non autorisé") {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Erreur standardisée pour permissions insuffisantes
 */
export function forbiddenResponse(message: string = "Permissions insuffisantes") {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" },
    }
  );
}
