/**
 * API Routes pour la gestion des utilisateurs (Admin uniquement)
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import { authenticate, unauthorizedResponse, forbiddenResponse } from "@/lib/auth-middleware";
import { hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { z } from "zod";
import logger from "@/lib/logger";
import type { UserRow } from "@/types";

const createUserSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  roleId: z.string().min(1, "Le rôle est requis"),
});

const updateUserSchema = z.object({
  username: z.string().min(3).optional(),
  password: z.string().min(6).optional(),
  roleId: z.string().min(1).optional(),
});

interface AdminUser extends UserRow {
  roleName: string;
  roleLevel: number;
}

/**
 * GET /api/admin/users
 * Liste tous les utilisateurs avec leurs rôles
 */
export async function GET(request: NextRequest) {
  const user = authenticate(request);
  if (!user) {
    return unauthorizedResponse("Authentification requise");
  }

  // Vérifier que l'utilisateur est admin (level 2)
  if (user.roleLevel < 2) {
    return forbiddenResponse("Accès réservé aux administrateurs");
  }

  try {
    const users = await query(
      `SELECT u.id, u.username, u.role, u.createdAt, r.roleName, r.level as roleLevel
       FROM users u
       JOIN roles r ON u.role = r.id
       ORDER BY u.createdAt DESC`
    ) as unknown as AdminUser[];

    return NextResponse.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        username: u.username,
        roleId: u.role,
        roleName: u.roleName,
        roleLevel: u.roleLevel,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    logger.error("GET /api/admin/users error", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Crée un nouvel utilisateur
 */
export async function POST(request: NextRequest) {
  const user = authenticate(request);
  if (!user) {
    return unauthorizedResponse("Authentification requise");
  }

  if (user.roleLevel < 2) {
    return forbiddenResponse("Accès réservé aux administrateurs");
  }

  try {
    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { username, password, roleId } = validation.data;

    // Vérifier si l'utilisateur existe déjà
    const existing = await query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    ) as UserRow[];

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Ce nom d'utilisateur existe déjà" },
        { status: 409 }
      );
    }

    // Vérifier que le rôle existe
    const roles = await query(
      "SELECT id FROM roles WHERE id = ?",
      [roleId]
    ) as UserRow[];

    if (roles.length === 0) {
      return NextResponse.json(
        { error: "Rôle invalide" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password);

    // Créer l'utilisateur
    const userId = randomUUID();
    await query(
      `INSERT INTO users (id, username, password, role, createdAt, createdBy)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [userId, username, hashedPassword, roleId, user.userId]
    );

    // Audit trail
    await logAudit({
      userId: user.userId,
      action: "CREATE",
      tableName: "users",
      recordId: userId,
      changes: { username, roleId },
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      data: { id: userId, username, roleId },
    }, { status: 201 });
  } catch (error) {
    logger.error("POST /api/admin/users error", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users/:id
 * Met à jour un utilisateur
 */
export async function PUT(request: NextRequest) {
  const user = authenticate(request);
  if (!user) {
    return unauthorizedResponse("Authentification requise");
  }

  if (user.roleLevel < 2) {
    return forbiddenResponse("Accès réservé aux administrateurs");
  }

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { username, password, roleId } = validation.data;

    // Vérifier que l'utilisateur existe
    const existing = await query(
      "SELECT id FROM users WHERE id = ?",
      [userId]
    ) as Array<{id: string}>;

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Construire la requête de mise à jour
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (username) {
      // Vérifier que le username n'est pas déjà pris
      const duplicate = await query(
        "SELECT id FROM users WHERE username = ? AND id != ?",
        [username, userId]
      ) as Array<{id: string}>;

      if (duplicate.length > 0) {
        return NextResponse.json(
          { error: "Ce nom d'utilisateur existe déjà" },
          { status: 409 }
        );
      }

      updates.push("username = ?");
      values.push(username);
    }

    if (password) {
      const hashedPassword = await hashPassword(password);
      updates.push("password = ?");
      values.push(hashedPassword);
    }

    if (roleId) {
      // Vérifier que le rôle existe
      const roles = await query(
        "SELECT id FROM roles WHERE id = ?",
        [roleId]
      ) as Array<{id: string}>;

      if (roles.length === 0) {
        return NextResponse.json(
          { error: "Rôle invalide" },
          { status: 400 }
        );
      }

      updates.push("role = ?");
      values.push(roleId);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "Aucune modification fournie" },
        { status: 400 }
      );
    }

    // Ajouter updatedBy
    updates.push("updatedBy = ?");
    updates.push("updatedAt = NOW()");
    values.push(user.userId);
    values.push(userId);
    
    await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    // Audit trail
    const changes: Record<string, string | number | undefined> = {};
    if (username) changes.username = username;
    if (password) changes.password = "[REDACTED]";
    if (roleId) changes.roleId = roleId;
    
    await logAudit({
      userId: user.userId,
      action: "UPDATE",
      tableName: "users",
      recordId: userId,
      changes,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Utilisateur mis à jour",
    });
  } catch (error) {
    logger.error("PUT /api/admin/users error", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'utilisateur" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/:id
 * Supprime un utilisateur
 */
export async function DELETE(request: NextRequest) {
  const user = authenticate(request);
  if (!user) {
    return unauthorizedResponse("Authentification requise");
  }

  if (user.roleLevel < 2) {
    return forbiddenResponse("Accès réservé aux administrateurs");
  }

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    // Empêcher la suppression de soi-même
    if (userId === user.userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const existing = await query(
      "SELECT id FROM users WHERE id = ? AND deletedAt IS NULL",
      [userId]
    ) as Array<{id: string}>;

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Soft delete au lieu de DELETE physique
    await query(
      "UPDATE users SET deletedAt = NOW(), updatedBy = ? WHERE id = ?",
      [user.userId, userId]
    );

    // Audit trail
    await logAudit({
      userId: user.userId,
      action: "DELETE",
      tableName: "users",
      recordId: userId,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Utilisateur supprimé",
    });
  } catch (error) {
    logger.error("DELETE /api/admin/users error", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'utilisateur" },
      { status: 500 }
    );
  }
}
