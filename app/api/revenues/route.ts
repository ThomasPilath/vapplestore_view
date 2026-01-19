import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import { CreateRevenueSchema } from "@/lib/validators";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response";

/**
 * GET /api/revenues
 * Récupère toutes les entrées de revenu
 */
export async function GET(req: NextRequest) {
  try {
    // Optionnel: filtrer par mois
    const searchParams = req.nextUrl.searchParams;
    const month = searchParams.get("month");

    let sql = "SELECT * FROM revenues ORDER BY date DESC";
    const params: any[] = [];

    if (month) {
      sql = "SELECT * FROM revenues WHERE DATE_FORMAT(date, '%Y-%m') = ? ORDER BY date DESC";
      params.push(month);
    }

    const results = await query(sql, params);
    return successResponse(results);
  } catch (error) {
    console.error("❌ GET /api/revenues error:", error);
    return errorResponse("Failed to fetch revenues", 500);
  }
}

/**
 * POST /api/revenues
 * Crée une nouvelle entrée de revenu
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validation avec Zod
    const validatedData = CreateRevenueSchema.parse(body);

    const id = randomUUID();
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const sql = `
      INSERT INTO revenues (id, date, base20, tva20, base5_5, tva5_5, ht, ttc, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query(sql, [
      id,
      validatedData.date,
      validatedData.base20,
      validatedData.tva20,
      validatedData.base5_5,
      validatedData.tva5_5,
      validatedData.ht,
      validatedData.ttc,
      createdAt,
    ]);

    return successResponse(
      {
        id,
        ...validatedData,
        createdAt,
      },
      201
    );
  } catch (error: any) {
    console.error("❌ POST /api/revenues error:", error);

    // Gestion des erreurs Zod
    if (error.name === "ZodError") {
      const fieldErrors: Record<string, string[]> = {};
      error.errors.forEach((err: any) => {
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
  try {
    await query("DELETE FROM revenues");
    return successResponse({ message: "All revenues deleted" });
  } catch (error) {
    console.error("❌ DELETE /api/revenues error:", error);
    return errorResponse("Failed to delete revenues", 500);
  }
}
