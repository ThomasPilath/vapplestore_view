/**
 * API Route: POST /api/auth/login
 * Authentifie un utilisateur et retourne les tokens JWT
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword, generateTokenPair } from "@/lib/auth";
import { z } from "zod";

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

interface Role {
  id: string;
  roleName: string;
  level: number;
}

export async function POST(request: NextRequest) {
  try {
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
    ) as Array<User & { roleName: string; roleLevel: number }>;

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

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.roleName,
        roleLevel: user.roleLevel,
      },
      tokens,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la connexion" },
      { status: 500 }
    );
  }
}
