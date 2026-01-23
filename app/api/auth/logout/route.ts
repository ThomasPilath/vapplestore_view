/**
 * API Route: POST /api/auth/logout
 * Déconnecte l'utilisateur (côté client principalement)
 */

import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Déconnexion réussie",
  });

  // Supprimer les cookies d'authentification
  response.cookies.set({ name: "accessToken", value: "", path: "/", maxAge: 0 });
  response.cookies.set({ name: "refreshToken", value: "", path: "/", maxAge: 0 });

  return response;
}
