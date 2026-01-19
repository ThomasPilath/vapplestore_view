/**
 * Script d'initialisation de la base de données
 * Crée les tables si elles n'existent pas
 * À exécuter une seule fois au démarrage
 */

import { query } from "@/lib/db";

export async function initializeDatabase() {
  try {
    // Créer la table revenues
    await query(`
      CREATE TABLE IF NOT EXISTS revenues (
        id VARCHAR(36) PRIMARY KEY,
        date DATE NOT NULL,
        base20 DECIMAL(10, 2) NOT NULL DEFAULT 0,
        tva20 DECIMAL(10, 2) NOT NULL DEFAULT 0,
        base5_5 DECIMAL(10, 2) NOT NULL DEFAULT 0,
        tva5_5 DECIMAL(10, 2) NOT NULL DEFAULT 0,
        ht DECIMAL(10, 2) NOT NULL DEFAULT 0,
        ttc DECIMAL(10, 2) NOT NULL DEFAULT 0,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Créer la table purchases
    await query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id VARCHAR(36) PRIMARY KEY,
        date DATE NOT NULL,
        priceHT DECIMAL(10, 2) NOT NULL,
        tva DECIMAL(10, 2) NOT NULL DEFAULT 0,
        shippingFee DECIMAL(10, 2) NOT NULL DEFAULT 0,
        ttc DECIMAL(10, 2) NOT NULL DEFAULT 0,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log("✅ Database tables initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    throw error;
  }
}
