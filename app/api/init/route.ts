import { initializeDatabase } from "@/lib/db-init";
import { NextRequest } from "next/server";
import { authenticate, unauthorizedResponse } from "@/lib/auth-middleware";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
  // Vérifier l'authentification
  const user = authenticate(req);
  if (!user) {
    return unauthorizedResponse("Authentification requise");
  }

  try {
    await initializeDatabase();
    return Response.json({
      success: true,
      message: "Database initialized successfully",
    });
  } catch (error) {
    logger.error("Database initialization error", error);
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
