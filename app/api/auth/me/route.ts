/**
 * API Route: GET /api/auth/me
 * Retourne les informations de l'utilisateur courant à partir du JWT stocké en cookie
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;

  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Session expirée" }, { status: 401 });
  }

  try {
    const users = await query(
      `SELECT u.id, u.username, u.role, r.roleName, r.level as roleLevel
       FROM users u
       JOIN roles r ON u.role = r.id
       WHERE u.id = ?`,
      [payload.userId]
    ) as Array<{ id: string; username: string; role: string; roleName: string; roleLevel: number }>;

    if (users.length === 0) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const user = users[0];

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.roleName,
        roleLevel: user.roleLevel,
      },
    });
  } catch (error) {
    console.error("❌ GET /api/auth/me error:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération de l'utilisateur" }, { status: 500 });
  }
}
