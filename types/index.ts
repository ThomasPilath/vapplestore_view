/**
 * Types globaux pour l'application Vapplestore View
 * Ces types sont prêts pour la sérialisation API/Base de données
 */

/**
 * Entrée de chiffre d'affaires
 * Stocke uniquement les bases et TVA; les totaux sont calculés à l'affichage
 */
export type RevenueEntry = {
  id: string;
  date: string;
  base20: number;
  tva20: number;
  base5_5: number;
  tva5_5: number;
  createdAt: string;
  updatedAt: string;
  /** Totaux calculés côté client pour l'affichage */
  totalHT: number;
  totalTTC: number;
};

/**
 * Entrée d'achat/dépense
 * Utilise la nouvelle nomenclature (totalHT / totalTTC)
 */
export type PurchaseEntry = {
  id: string;
  date: string;
  totalHT: number;
  tva: number;
  shippingFee: number;
  totalTTC: number;
  createdAt: string;
  updatedAt: string;
};

/** Rôle utilisateur (autorisation) */
export type Role = {
  id: string;
  roleName: string;
  level: number;
};

/** Compte utilisateur pour l'authentification */
export type UserAccount = {
  id: string;
  username: string;
  password: string;
  role: string;
  createdAt: string;
};

/**
 * Paramètres de l'utilisateur
 * Structure pour les préférences personnelles
 */
export type UserSettings = {
  /** Masquer les dimanches dans les graphiques */
  hideSundays: boolean;
};

/**
 * Réponse API standardisée
 * Utiliser cette structure pour toutes les réponses API
 */
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
};

/**
 * Payload pour créer une entrée de revenu
 * (les totaux sont calculés côté backend/frontend)
 */
export type CreateRevenuePayload = {
  date: string;
  base20: number;
  tva20: number;
  base5_5: number;
  tva5_5: number;
};

/**
 * Payload pour créer une entrée d'achat
 */
export type CreatePurchasePayload = {
  date: string;
  totalHT: number;
  tva: number;
  shippingFee: number;
  totalTTC: number;
};
/** Ligne brute de la base de données - Purchase */
export type PurchaseRow = {
  id: string;
  date: string | Date;
  totalHT: string | number;
  tva: string | number;
  shippingFee: string | number;
  totalTTC: string | number;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy?: string;
  deletedAt?: string | Date | null;
};

/** Ligne brute de la base de données - User */
export type UserRow = {
  id: string;
  username: string;
  password: string;
  role: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  createdBy?: string;
  deletedAt?: string | Date | null;
  roleName?: string;
  roleLevel?: number;
};

/** Ligne brute de la base de données - Role */
export type RoleRow = {
  id: string;
  roleName: string;
  level: number;
};

/** Erreur Zod formatée */
export type ZodErrorField = {
  path: (string | number)[];
  message: string;
  code: string;
};