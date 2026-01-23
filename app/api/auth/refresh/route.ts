/**
 * API Route: POST /api/auth/refresh
 * Rafraîchit un access token à partir d'un refresh token valide
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from "@/lib/auth";

const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 jours

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refreshToken")?.value;
    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token manquant" },
        { status: 401 }
      );
    }

    // Vérifier le refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      const response = NextResponse.json(
        { error: "Refresh token invalide ou expiré" },
        { status: 401 }
      );
      
      // Nettoyer les cookies expirés/invalides
      response.cookies.set({ name: "accessToken", value: "", path: "/", maxAge: 0 });
      response.cookies.set({ name: "refreshToken", value: "", path: "/", maxAge: 0 });
      return response;
    }

    // Générer un nouveau access token
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
      roleLevel: payload.roleLevel,
    });

    // Rotation du refresh token pour prolonger la session
    const newRefreshToken = generateRefreshToken({
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
      roleLevel: payload.roleLevel,
    });

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set({
      name: "accessToken",
      value: newAccessToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    response.cookies.set({
      name: "refreshToken",
      value: newRefreshToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("❌ Refresh token error:", error);
    return NextResponse.json(
      { error: "Erreur lors du rafraîchissement du token" },
      { status: 500 }
    );
  }
}
