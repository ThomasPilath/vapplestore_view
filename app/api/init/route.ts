import { NextRequest } from "next/server";
import { authenticate, unauthorizedResponse, forbiddenResponse } from "@/lib/auth-middleware";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
  // ⚠️ Requiert une authentification
  const user = authenticate(req);
  if (!user) {
    return unauthorizedResponse("Authentification requise");
  }

  // ⚠️ Requiert un rôle admin (level 2)
  if (user.roleLevel < 2) {
    return forbiddenResponse("Seul un administrateur peut accéder à cet endpoint");
  }

  try {
    return Response.json({
      success: true,
      message: "Init endpoint - database already initialized at startup",
    });
  } catch (error) {
    logger.error("Init endpoint error", error);
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
