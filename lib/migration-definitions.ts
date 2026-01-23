/**
 * Définition de toutes les migrations de la base de données
 * Chaque migration a un numéro de version et des fonctions up/down
 */

import { query } from "@/lib/db";
import type { Migration } from "@/lib/migrations";

export const migrations: Migration[] = [
  // Migration 1: Tables initiales
  {
    version: 1,
    name: "initial_tables",
    up: async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS roles (
          id VARCHAR(36) PRIMARY KEY,
          roleName VARCHAR(50) NOT NULL UNIQUE,
          level INT NOT NULL DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY,
          username VARCHAR(100) NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(36) NOT NULL,
          settings JSON DEFAULT NULL,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          createdBy VARCHAR(36) DEFAULT NULL,
          updatedAt DATETIME DEFAULT NULL,
          updatedBy VARCHAR(36) DEFAULT NULL,
          deletedAt DATETIME DEFAULT NULL,
          CONSTRAINT fk_users_role FOREIGN KEY (role) REFERENCES roles(id),
          INDEX idx_username (username),
          INDEX idx_deletedAt (deletedAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS revenues (
          id VARCHAR(36) PRIMARY KEY,
          date DATE NOT NULL,
          base20 DECIMAL(10, 2) NOT NULL DEFAULT 0,
          tva20 DECIMAL(10, 2) NOT NULL DEFAULT 0,
          base5_5 DECIMAL(10, 2) NOT NULL DEFAULT 0,
          tva5_5 DECIMAL(10, 2) NOT NULL DEFAULT 0,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          createdBy VARCHAR(36) DEFAULT NULL,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          updatedBy VARCHAR(36) DEFAULT NULL,
          deletedAt DATETIME DEFAULT NULL,
          INDEX idx_date (date),
          INDEX idx_deletedAt (deletedAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS purchases (
          id VARCHAR(36) PRIMARY KEY,
          date DATE NOT NULL,
          totalHT DECIMAL(10, 2) NOT NULL DEFAULT 0,
          tva DECIMAL(10, 2) NOT NULL DEFAULT 0,
          shippingFee DECIMAL(10, 2) NOT NULL DEFAULT 0,
          totalTTC DECIMAL(10, 2) NOT NULL DEFAULT 0,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          createdBy VARCHAR(36) DEFAULT NULL,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          updatedBy VARCHAR(36) DEFAULT NULL,
          deletedAt DATETIME DEFAULT NULL,
          INDEX idx_date (date),
          INDEX idx_deletedAt (deletedAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    },
    down: async () => {
      await query("DROP TABLE IF EXISTS purchases");
      await query("DROP TABLE IF EXISTS revenues");
      await query("DROP TABLE IF EXISTS users");
      await query("DROP TABLE IF EXISTS roles");
    },
  },

  // Migration 2: Audit trail table
  {
    version: 2,
    name: "audit_trail",
    up: async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS audit_log (
          id VARCHAR(36) PRIMARY KEY,
          userId VARCHAR(36) NOT NULL,
          action VARCHAR(50) NOT NULL,
          tableName VARCHAR(100) NOT NULL,
          recordId VARCHAR(36) DEFAULT NULL,
          changes JSON DEFAULT NULL,
          ip VARCHAR(45) DEFAULT NULL,
          userAgent TEXT DEFAULT NULL,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_userId (userId),
          INDEX idx_tableName (tableName),
          INDEX idx_action (action),
          INDEX idx_createdAt (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    },
    down: async () => {
      await query("DROP TABLE IF EXISTS audit_log");
    },
  },

  // Migration 3: Index unique sur username
  {
    version: 3,
    name: "unique_username_index",
    up: async () => {
      // Vérifier d'abord si l'index existe
      const indexes = await query(`
        SELECT INDEX_NAME 
        FROM information_schema.statistics 
        WHERE table_schema = DATABASE() 
        AND table_name = 'users' 
        AND index_name = 'idx_username'
`) as Array<{COLUMN_NAME: string}>;

      if (indexes.length > 0) {
        // Supprimer l'ancien index non unique
        await query("ALTER TABLE users DROP INDEX idx_username");
      }

      // Créer l'index unique
      await query("ALTER TABLE users ADD UNIQUE INDEX idx_username (username)");
    },
    down: async () => {
      await query("ALTER TABLE users DROP INDEX idx_username");
      await query("ALTER TABLE users ADD INDEX idx_username (username)");
    },
  },
];
