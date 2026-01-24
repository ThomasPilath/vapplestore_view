/**
 * Endpoint de vérification de l'initialisation DB
 * L'initialisation se fait maintenant au démarrage du serveur (voir app/init.ts)
 * Cet endpoint sert uniquement pour vérifier le statut
 */

import { NextResponse } from "next/server";
import logger from "@/lib/logger";
import { ensureDatabaseInitialized } from "@/app/init";

export async function POST() {
  try {
    console.log("ℹ️  [HEALTH-CHECK] Vérification du statut d'initialisation DB");
    
    // Attendre que l'initialisation soit complète
    await ensureDatabaseInitialized();
    
    return NextResponse.json(
      {
        success: true,
        message: "Database is initialized and ready",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ [HEALTH-CHECK] Database not ready:", error);
    logger.error("Database health check failed", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Database not ready",
      },
      { status: 503 } // Service Unavailable
    );
  }
}

export async function GET() {
  try {
    console.log("ℹ️  [HEALTH-CHECK] GET - Vérification du statut d'initialisation DB");
    
    // Attendre que l'initialisation soit complète
    await ensureDatabaseInitialized();
    
    return NextResponse.json(
      {
        success: true,
        message: "Database is initialized and ready",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ [HEALTH-CHECK] Database not ready:", error);
    logger.error("Database health check failed", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Database not ready",
      },
      { status: 503 }
    );
  }
}
