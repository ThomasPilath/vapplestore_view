import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import { CreatePurchaseSchema } from "@/lib/validators";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response";

/**
 * GET /api/purchases
 * Récupère tous les achats
 */
export async function GET(req: NextRequest) {
  try {
    // Optionnel: filtrer par mois
    const searchParams = req.nextUrl.searchParams;
    const month = searchParams.get("month");

    let sql = "SELECT * FROM purchases ORDER BY date DESC";
    const params: any[] = [];

    if (month) {
      sql = "SELECT * FROM purchases WHERE DATE_FORMAT(date, '%Y-%m') = ? ORDER BY date DESC";
      params.push(month);
    }

    const results = await query(sql, params);
    return successResponse(results);
  } catch (error) {
    console.error("❌ GET /api/purchases error:", error);
    return errorResponse("Failed to fetch purchases", 500);
  }
}

/**
 * POST /api/purchases
 * Crée un nouvel achat
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validation avec Zod
    const validatedData = CreatePurchaseSchema.parse(body);

    const id = randomUUID();
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const sql = `
      INSERT INTO purchases (id, date, priceHT, tva, shippingFee, ttc, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await query(sql, [
      id,
      validatedData.date,
      validatedData.priceHT,
      validatedData.tva,
      validatedData.shippingFee,
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
    console.error("❌ POST /api/purchases error:", error);

    // Gestion des erreurs Zod
    if (error.name === "ZodError") {
      const fieldErrors: Record<string, string[]> = {};
      error.errors.forEach((err: any) => {
        const field = err.path.join(".");
        fieldErrors[field] = [err.message];
      });
      return validationErrorResponse(fieldErrors);
    }

    return errorResponse("Failed to create purchase", 500);
  }
}

/**
 * DELETE /api/purchases
 * Supprime tous les achats (ATTENTION: action destructrice)
 */
export async function DELETE(req: NextRequest) {
  try {
    await query("DELETE FROM purchases");
    return successResponse({ message: "All purchases deleted" });
  } catch (error) {
    console.error("❌ DELETE /api/purchases error:", error);
    return errorResponse("Failed to delete purchases", 500);
  }
}
