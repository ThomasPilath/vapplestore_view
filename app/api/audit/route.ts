/**
 * API Route: GET /api/audit/:recordId
 * Récupère l'historique d'audit pour un enregistrement
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticate, unauthorizedResponse, forbiddenResponse } from "@/lib/auth-middleware";
import { getRecordAuditHistory, getUserAuditHistory } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const user = authenticate(request);
  if (!user) {
    return unauthorizedResponse("Authentification requise");
  }

  // Seuls les admins peuvent voir les audits
  if (user.roleLevel < 2) {
    return forbiddenResponse("Accès réservé aux administrateurs");
  }

  try {
    const url = new URL(request.url);
    const recordId = url.searchParams.get("recordId");
    const tableName = url.searchParams.get("table");
    const userId = url.searchParams.get("userId");

    let history;

    if (recordId && tableName) {
      history = await getRecordAuditHistory(tableName, recordId);
    } else if (userId) {
      history = await getUserAuditHistory(userId, 100);
    } else {
      return NextResponse.json(
        { error: "Paramètres manquants: recordId+table ou userId requis" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("❌ GET /api/audit error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique d'audit" },
      { status: 500 }
    );
  }
}
