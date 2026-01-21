/**
 * API Route: POST /api/auth/refresh
 * Rafraîchit un access token à partir d'un refresh token valide
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, generateAccessToken } from "@/lib/auth";
import { z } from "zod";

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Le refresh token est requis"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation
    const validation = refreshSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { refreshToken } = validation.data;

    // Vérifier le refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { error: "Refresh token invalide ou expiré" },
        { status: 401 }
      );
    }

    // Générer un nouveau access token
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
      roleLevel: payload.roleLevel,
    });

    return NextResponse.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("❌ Refresh token error:", error);
    return NextResponse.json(
      { error: "Erreur lors du rafraîchissement du token" },
      { status: 500 }
    );
  }
}
