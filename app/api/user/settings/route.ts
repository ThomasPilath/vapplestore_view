/**
 * API Routes pour les paramètres utilisateur
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { authenticate, unauthorizedResponse } from "@/lib/auth-middleware";
import { z } from "zod";

const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  hideSundays: z.boolean().optional(),
});

interface UserSettings {
  theme?: "light" | "dark" | "system";
  hideSundays?: boolean;
}

/**
 * GET /api/user/settings
 * Récupère les paramètres de l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  const user = authenticate(request);
  if (!user) {
    return unauthorizedResponse("Authentification requise");
  }

  try {
    const users = await query(
      "SELECT settings FROM users WHERE id = ?",
      [user.userId]
    ) as any[];

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Parser les settings JSON ou retourner des valeurs par défaut
    let settings: UserSettings = {
      theme: "system",
      hideSundays: true,
    };

    if (users[0].settings) {
      try {
        const parsed = typeof users[0].settings === "string" 
          ? JSON.parse(users[0].settings)
          : users[0].settings;
        settings = { ...settings, ...parsed };
      } catch (e) {
        console.error("Erreur parsing settings:", e);
      }
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("❌ GET /api/user/settings error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des paramètres" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/settings
 * Met à jour les paramètres de l'utilisateur connecté
 */
export async function PUT(request: NextRequest) {
  const user = authenticate(request);
  if (!user) {
    return unauthorizedResponse("Authentification requise");
  }

  try {
    const body = await request.json();
    const validation = settingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.errors },
        { status: 400 }
      );
    }

    // Récupérer les settings actuels
    const users = await query(
      "SELECT settings FROM users WHERE id = ?",
      [user.userId]
    ) as any[];

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Fusionner avec les nouveaux settings
    let currentSettings: UserSettings = {};
    if (users[0].settings) {
      try {
        currentSettings = typeof users[0].settings === "string"
          ? JSON.parse(users[0].settings)
          : users[0].settings;
      } catch (e) {
        console.error("Erreur parsing settings:", e);
      }
    }

    const newSettings = { ...currentSettings, ...validation.data };

    // Sauvegarder
    await query(
      "UPDATE users SET settings = ? WHERE id = ?",
      [JSON.stringify(newSettings), user.userId]
    );

    return NextResponse.json({
      success: true,
      data: newSettings,
    });
  } catch (error) {
    console.error("❌ PUT /api/user/settings error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde des paramètres" },
      { status: 500 }
    );
  }
}
