/**
 * API Route: POST /api/auth/login
 * Authentifie un utilisateur et dépose les tokens JWT en cookies HttpOnly
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword, generateTokenPair } from "@/lib/auth";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";

const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 jours

const loginSchema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

interface User {
  id: string;
  username: string;
  password: string;
  role: string;
  createdAt: Date;
}

interface _Role {
  id: string;
  roleName: string;
  level: number;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, retryAfterSeconds } = rateLimit(request, `login:${ip}`, 5, 15 * 60 * 1000);
    if (!allowed) {
      return rateLimitResponse(retryAfterSeconds);
    }

    const body = await request.json();
    
    // Validation
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { username, password } = validation.data;

    // Récupérer l'utilisateur avec son rôle
    const users = await query(
      `SELECT u.id, u.username, u.password, u.role, u.createdAt, 
              r.roleName, r.level as roleLevel
       FROM users u
       JOIN roles r ON u.role = r.id
       WHERE u.username = ?`,
      [username]
    ) as unknown as Array<User & { roleName: string; roleLevel: number }>;

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Identifiants incorrects" },
        { status: 401 }
      );
    }

    const user = users[0];

    // Vérifier le mot de passe
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Identifiants incorrects" },
        { status: 401 }
      );
    }

    // Générer les tokens
    const tokens = generateTokenPair({
      userId: user.id,
      username: user.username,
      role: user.role,
      roleLevel: user.roleLevel,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.roleName,
        roleLevel: user.roleLevel,
      },
    });

    response.cookies.set({
      name: "accessToken",
      value: tokens.accessToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    response.cookies.set({
      name: "refreshToken",
      value: tokens.refreshToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("❌ Login error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la connexion" },
      { status: 500 }
    );
  }
}
