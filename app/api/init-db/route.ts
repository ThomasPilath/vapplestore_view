/**
 * Endpoint interne pour initialiser la base de données
 * Appelé automatiquement au démarrage de l'app (via DatabaseChecker)
 * N'expose pas d'endpoint public - une seule tentative d'init
 */

import { initializeDatabase } from "@/lib/db-init";
import { NextResponse } from "next/server";
import logger from "@/lib/logger";

let isInitialized = false;

export async function POST() {
  // Garder en mémoire si déjà initialisé (une seule fois par process)
  if (isInitialized) {
    return NextResponse.json(
      {
        success: true,
        message: "Database already initialized in this process",
      },
      { status: 200 }
    );
  }

  try {
    isInitialized = true;
    await initializeDatabase();

    return NextResponse.json(
      {
        success: true,
        message: "Database initialized successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Database initialization error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
