/**
 * Endpoint pour vérifier et migrer la structure de la base de données
 * ⚠️ Requiert une authentification (admin uniquement)
 */

import { verifyAndMigrateTables } from "@/lib/db-migrations";
import { NextRequest, NextResponse } from "next/server";
import { authenticate, unauthorizedResponse, forbiddenResponse } from "@/lib/auth-middleware";
import logger from "@/lib/logger";

let isChecking = false;
let lastCheckTimestamp = 0;
const CHECK_COOLDOWN = 60000; // 1 minute entre chaque vérification

export async function GET(req: NextRequest) {
  // ⚠️ Requiert une authentification
  const user = authenticate(req);
  if (!user) {
    return unauthorizedResponse("Authentification requise");
  }

  // ⚠️ Requiert un rôle admin (level 2)
  if (user.roleLevel < 2) {
    return forbiddenResponse("Seul un administrateur peut vérifier la DB");
  }

  const now = Date.now();
  
  // Éviter les vérifications trop fréquentes
  if (isChecking) {
    return NextResponse.json({
      success: true,
      message: "Database check already in progress",
    });
  }
  
  if (now - lastCheckTimestamp < CHECK_COOLDOWN) {
    return NextResponse.json({
      success: true,
      message: "Database recently checked",
      lastCheck: new Date(lastCheckTimestamp).toISOString(),
    });
  }

  isChecking = true;
  
  try {
    await verifyAndMigrateTables();
    lastCheckTimestamp = now;
    
    return NextResponse.json({
      success: true,
      message: "Database structure verified and updated",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error("Database check error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  } finally {
    isChecking = false;
  }
}
