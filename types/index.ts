/**
 * Types globaux pour l'application Vapplestore View
 * Ces types sont prêts pour la sérialisation API/Base de données
 */

/**
 * Entrée de chiffre d'affaires
 * Représente une vente avec détails TVA (taux multiples)
 * Structure prête pour envoi à une API/base de données
 */
export type RevenueEntry = {
  /** ID unique (à remplacer par UUID en production) */
  id: string;
  /** Date de la saisie au format ISO (YYYY-MM-DD) */
  date: string;
  /** Base HT pour taux de TVA 20% */
  base20: number;
  /** TVA 20% */
  tva20: number;
  /** Base HT pour taux de TVA 5.5% */
  base5_5: number;
  /** TVA 5.5% */
  tva5_5: number;
  /** Total HT (somme des bases) */
  ht: number;
  /** Total TTC (HT + TVA) */
  ttc: number;
  /** Timestamp de création ISO */
  createdAt: string;
};

/**
 * Entrée d'achat/dépense
 * Représente un achat avec frais additionnels
 * Structure prête pour envoi à une API/base de données
 */
export type PurchaseEntry = {
  /** ID unique (à remplacer par UUID en production) */
  id: string;
  /** Date d'achat au format ISO (YYYY-MM-DD) */
  date: string;
  /** Prix HT de la marchandise */
  priceHT: number;
  /** TVA 20% sur le prix */
  tva: number;
  /** Frais de port/livraison */
  shippingFee: number;
  /** Total TTC (prix HT + TVA + frais port) */
  ttc: number;
  /** Timestamp de création ISO */
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
 * (sans id et createdAt, générés par le backend)
 */
export type CreateRevenuePayload = Omit<RevenueEntry, "id" | "createdAt">;

/**
 * Payload pour créer une entrée d'achat
 * (sans id et createdAt, générés par le backend)
 */
export type CreatePurchasePayload = Omit<PurchaseEntry, "id" | "createdAt">;
