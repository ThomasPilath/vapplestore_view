/**
 * API Route: POST /api/auth/logout
 * Déconnecte l'utilisateur (côté client principalement)
 */

import { NextResponse } from "next/server";

export async function POST() {
  // Le logout est principalement géré côté client en supprimant les tokens
  // Cette route existe pour la symétrie et pour des traitements futurs éventuels
  return NextResponse.json({
    success: true,
    message: "Déconnexion réussie",
  });
}
