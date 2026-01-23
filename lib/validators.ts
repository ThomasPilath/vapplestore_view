import { z } from "zod";

/**
 * Schéma de validation pour le mot de passe
 * Minimum 8 caractères, au moins une majuscule, une minuscule, un chiffre et un caractère spécial
 */
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

/**
 * Schéma de validation pour le nom d'utilisateur
 * Alphanumerique, underscores et tirets autorisés, 3-20 caractères
 */
export const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores and hyphens");

/**
 * Schéma de validation pour l'email
 */
export const emailSchema = z.string()
  .email("Invalid email address")
  .max(255, "Email must be at most 255 characters");

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
});

export type CreateRevenueInput = z.infer<typeof CreateRevenueSchema>;

/**
 * Schéma complet d'une entrée Revenue (avec id et createdAt)
 */
export const RevenueSchema = CreateRevenueSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Revenue = z.infer<typeof RevenueSchema>;

/**
 * Schéma de validation pour créer une entrée Purchase
 */
export const CreatePurchaseSchema = z.object({
  date: z.string().date("Date must be in YYYY-MM-DD format"),
  totalHT: z.number().min(0, "totalHT must be positive"),
  tva: z.number().min(0, "tva must be positive"),
  shippingFee: z.number().min(0, "shippingFee must be positive"),
  totalTTC: z.number().min(0, "totalTTC must be positive"),
});

export type CreatePurchaseInput = z.infer<typeof CreatePurchaseSchema>;

/**
 * Schéma complet d'une entrée Purchase
 */
export const PurchaseSchema = CreatePurchaseSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Purchase = z.infer<typeof PurchaseSchema>;
