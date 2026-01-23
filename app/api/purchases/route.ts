import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import { CreatePurchaseSchema } from "@/lib/validators";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response";
import { initializeDatabase } from "@/lib/db-init";
import { authenticate, unauthorizedResponse } from "@/lib/auth-middleware";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import logger from "@/lib/logger";
import type { PurchaseRow, PurchaseEntry, ZodErrorField } from "@/types";

function mapPurchaseRow(row: PurchaseRow): PurchaseEntry {
  return {
    id: row.id,
    date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : row.date,
    totalHT: Number(row.totalHT ?? 0),
    tva: Number(row.tva ?? 0),
    shippingFee: Number(row.shippingFee ?? 0),
    totalTTC: Number(row.totalTTC ?? 0),
    createdAt: row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : row.createdAt,
    updatedAt: row.updatedAt instanceof Date
      ? row.updatedAt.toISOString()
      : row.updatedAt,
  };
}

async function safeQuery(sql: string, params: (string | number)[] = []): Promise<PurchaseRow[] | null> {
  try {
    const result = await query(sql, params);
    return Array.isArray(result) && result.length > 0 && 'id' in result[0] ? (result as unknown as PurchaseRow[]) : Array.isArray(result) ? [] : null;
  } catch (error: unknown) {
    const dbError = error as { code?: string; message?: string };
    if (dbError?.code === "ER_NO_SUCH_TABLE") {
      await initializeDatabase();
      const result = await query(sql, params);
      return Array.isArray(result) && result.length > 0 && 'id' in result[0] ? (result as unknown as PurchaseRow[]) : Array.isArray(result) ? [] : null;
    }
    throw error;
  }
}

/**
 * GET /api/purchases
 * Récupère tous les achats
 */
export async function GET(req: NextRequest) {
  // Vérifier l'authentification
  const user = authenticate(req);
  if (!user) {
    return unauthorizedResponse("Authentification requise");
  }

  try {
    // Optionnel: filtrer par mois
    const searchParams = req.nextUrl.searchParams;
    const month = searchParams.get("month");

    // Récupérer les achats
    let sql = "SELECT * FROM purchases ORDER BY date DESC";
    const params: (string | number)[] = [];

    if (month) {
      sql = "SELECT * FROM purchases WHERE DATE_FORMAT(date, '%Y-%m') = ? ORDER BY date DESC";
      params.push(month);
    }

    const results = await safeQuery(sql, params);
    const mapped = Array.isArray(results) ? results.map(mapPurchaseRow) : [];
    return successResponse(mapped);
  } catch (error) {
    logger.error("GET /api/purchases error", error);
    return errorResponse("Failed to fetch purchases", 500);
  }
}

/**
 * POST /api/purchases
 * Crée un nouvel achat
 */
export async function POST(req: NextRequest) {
  // Vérifier l'authentification
  const user = authenticate(req);
  if (!user) {
    return unauthorizedResponse("Authentification requise");
  }

  try {
    const body = await req.json();

    // Validation avec Zod
    const validatedData = CreatePurchaseSchema.parse(body);

    const id = randomUUID();
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const sql = `
      INSERT INTO purchases (id, date, totalHT, tva, shippingFee, totalTTC, createdAt, createdBy, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await safeQuery(sql, [
      id,
      validatedData.date,
      validatedData.totalHT,
      validatedData.tva,
      validatedData.shippingFee,
      validatedData.totalTTC,
      timestamp,
      user.userId,
      timestamp,
    ]);

    // Audit trail
    await logAudit({
      userId: user.userId,
      action: "CREATE",
      tableName: "purchases",
      recordId: id,
      changes: validatedData,
      ip: getClientIp(req),
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return successResponse(
      {
        id,
        ...validatedData,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      201
    );
  } catch (error: unknown) {
    const zodError = error as { name?: string; errors?: ZodErrorField[] };
    console.error("❌ POST /api/purchases error:", error);

    // Gestion des erreurs Zod
    if (zodError?.name === "ZodError") {
      const fieldErrors: Record<string, string[]> = {};
      zodError.errors?.forEach((err) => {
        const path = err.path.join(".");
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(err.message);
      });
      return validationErrorResponse(fieldErrors);
    }

    logger.error("POST /api/purchases error", error);
    return errorResponse("Failed to create purchase", 500);
  }
}

/**
 * DELETE /api/purchases
 * Supprime tous les achats (ATTENTION: action destructrice)
 */
export async function DELETE(req: NextRequest) {
  // Vérifier l'authentification
  const user = authenticate(req);
  if (!user) {
    return unauthorizedResponse("Authentification requise");
  }

  try {
    // Soft delete au lieu de DELETE physique
    await query("UPDATE purchases SET deletedAt = NOW(), updatedBy = ? WHERE deletedAt IS NULL", [user.userId]);
    
    // Audit trail
    await logAudit({
      userId: user.userId,
      action: "DELETE",
      tableName: "purchases",
      ip: getClientIp(req),
      userAgent: req.headers.get("user-agent") || undefined,
    });
    
    return successResponse({ message: "All purchases soft deleted" });
  } catch (error) {
    logger.error("DELETE /api/purchases error", error);
    return errorResponse("Failed to delete purchases", 500);
  }
}
