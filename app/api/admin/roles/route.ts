/**
 * API Route GET /api/admin/roles
 * Récupère la liste des rôles disponibles
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { authenticate, unauthorizedResponse, forbiddenResponse } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  const user = authenticate(request);
  if (!user) {
    return unauthorizedResponse("Authentification requise");
  }

  if (user.roleLevel < 2) {
    return forbiddenResponse("Accès réservé aux administrateurs");
  }

  try {
    const roles = await query(
      "SELECT id, roleName, level FROM roles ORDER BY level ASC"
    ) as Array<{id: string; roleName: string; level: number}>;

    return NextResponse.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error("❌ GET /api/admin/roles error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des rôles" },
      { status: 500 }
    );
  }
}
