import { z } from "zod";

/**
 * Schéma de validation pour créer une entrée Revenue
 * Les champs id et createdAt sont générés par le backend
 */
export const CreateRevenueSchema = z.object({
  date: z.string().date("Date must be in YYYY-MM-DD format"),
  base20: z.number().min(0, "base20 must be positive"),
  tva20: z.number().min(0, "tva20 must be positive"),
  base5_5: z.number().min(0, "base5_5 must be positive"),
  tva5_5: z.number().min(0, "tva5_5 must be positive"),
  ht: z.number().min(0, "ht must be positive"),
  ttc: z.number().min(0, "ttc must be positive"),
});

export type CreateRevenueInput = z.infer<typeof CreateRevenueSchema>;

/**
 * Schéma complet d'une entrée Revenue (avec id et createdAt)
 */
export const RevenueSchema = CreateRevenueSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export type Revenue = z.infer<typeof RevenueSchema>;

/**
 * Schéma de validation pour créer une entrée Purchase
 */
export const CreatePurchaseSchema = z.object({
  date: z.string().date("Date must be in YYYY-MM-DD format"),
  priceHT: z.number().min(0, "priceHT must be positive"),
  tva: z.number().min(0, "tva must be positive"),
  shippingFee: z.number().min(0, "shippingFee must be positive"),
  ttc: z.number().min(0, "ttc must be positive"),
});

export type CreatePurchaseInput = z.infer<typeof CreatePurchaseSchema>;

/**
 * Schéma complet d'une entrée Purchase
 */
export const PurchaseSchema = CreatePurchaseSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export type Purchase = z.infer<typeof PurchaseSchema>;
