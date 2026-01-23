import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import { CreateRevenueSchema } from "@/lib/validators";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response";
import { initializeDatabase } from "@/lib/db-init";
import { authenticate, unauthorizedResponse } from "@/lib/auth-middleware";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import logger from "@/lib/logger";

interface RevenueRow {
  id?: string;
  base20?: string | number;
  tva20?: string | number;
  base5_5?: string | number;
  tva5_5?: string | number;
  date?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

function mapRevenueRow(row: RevenueRow) {
  const base20 = Number(row.base20 ?? 0);
  const tva20 = Number(row.tva20 ?? 0);
  const base5_5 = Number(row.base5_5 ?? 0);
  const tva5_5 = Number(row.tva5_5 ?? 0);
  const totalHT = base20 + base5_5;
  const totalTTC = totalHT + tva20 + tva5_5;

  const formatDate = (d: unknown): string | undefined => {
    if (d instanceof Date) return d.toISOString().slice(0, 10);
    if (typeof d === 'string') return d;
    return undefined;
  };

  const formatDateTime = (d: unknown): string | undefined => {
    if (d instanceof Date) return d.toISOString();
    if (typeof d === 'string') return d;
    return undefined;
  };

  return {
    id: row.id,
    date: formatDate(row.date),
    base20,
    tva20,
    base5_5,
    tva5_5,
    createdAt: formatDateTime(row.createdAt),
    updatedAt: formatDateTime(row.updatedAt),
    totalHT,
    totalTTC,
  };
}

async function safeQuery(sql: string, params: (string | number)[] = []) {
  try {
    return await query(sql, params);
  } catch (error: unknown) {
    const dbError = error as { code?: string };
    if (dbError?.code === "ER_NO_SUCH_TABLE") {
      await initializeDatabase();
      return await query(sql, params);
    }
    throw error;
  }
}

/**
 * GET /api/revenues
 * Récupère toutes les entrées de revenu
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

    // Récupérer les revenus
    let sql = "SELECT * FROM revenues ORDER BY date DESC";
    const params: (string | number)[] = [];

    if (month) {
      sql = "SELECT * FROM revenues WHERE DATE_FORMAT(date, '%Y-%m') = ? ORDER BY date DESC";
      params.push(month);
    }

    const results = await safeQuery(sql, params);
    const mapped = Array.isArray(results) ? results.map(mapRevenueRow) : [];
    return successResponse(mapped);
  } catch (error) {
    logger.error("GET /api/revenues error", error);
    return errorResponse("Failed to fetch revenues", 500);
  }
}

/**
 * POST /api/revenues
 * Crée une nouvelle entrée de revenu
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
    const validatedData = CreateRevenueSchema.parse(body);

    const id = randomUUID();
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const sql = `
      INSERT INTO revenues (id, date, base20, tva20, base5_5, tva5_5, createdAt, createdBy, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await safeQuery(sql, [
      id,
      validatedData.date,
      validatedData.base20,
      validatedData.tva20,
      validatedData.base5_5,
      validatedData.tva5_5,
      timestamp,
      user.userId,
      timestamp,
    ]);

    // Audit trail
    await logAudit({
      userId: user.userId,
      action: "CREATE",
      tableName: "revenues",
      recordId: id,
      changes: validatedData,
      ip: getClientIp(req),
      userAgent: req.headers.get("user-agent") || undefined,
    });

    const totalHT = validatedData.base20 + validatedData.base5_5;
    const totalTTC = totalHT + validatedData.tva20 + validatedData.tva5_5;

    return successResponse(
      {
        id,
        ...validatedData,
        createdAt: timestamp,
        updatedAt: timestamp,
        totalHT,
        totalTTC,
      },
      201
    );
  } catch (error: unknown) {
    console.error("❌ POST /api/revenues error:", error);

    // Gestion des erreurs Zod
    if ((error as { name?: string }).name === "ZodError") {
      const fieldErrors: Record<string, string[]> = {};
      (error as { errors?: Array<{path: string[]; message: string}> }).errors?.forEach((err) => {
        const field = err.path.join(".");
        fieldErrors[field] = [err.message];
      });
      return validationErrorResponse(fieldErrors);
    }

    return errorResponse("Failed to create revenue", 500);
  }
}

/**
 * DELETE /api/revenues
 * Supprime toutes les entrées de revenu (ATTENTION: action destructrice)
 */
export async function DELETE(req: NextRequest) {
  // Vérifier l'authentification
  const user = authenticate(req);
  if (!user) {
    return unauthorizedResponse("Authentification requise");
  }

  try {
    // Soft delete au lieu de DELETE physique
    await query("UPDATE revenues SET deletedAt = NOW(), updatedBy = ? WHERE deletedAt IS NULL", [user.userId]);
    
    // Audit trail
    await logAudit({
      userId: user.userId,
      action: "DELETE",
      tableName: "revenues",
      ip: getClientIp(req),
      userAgent: req.headers.get("user-agent") || undefined,
    });
    
    return successResponse({ message: "All revenues soft deleted" });
  } catch (error) {
    logger.error("DELETE /api/revenues error", error);
    return errorResponse("Failed to delete revenues", 500);
  }
}
