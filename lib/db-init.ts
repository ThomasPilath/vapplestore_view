/**
 * Script d'initialisation de la base de données
 * Crée les tables si elles n'existent pas
 * À exécuter une seule fois au démarrage
 */

import { query } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { randomUUID } from "crypto";

let isInitialized = false;
let adminSeeded = false;

async function seedRoles() {
  const roles = [
    { id: "1", roleName: "vendeur", level: 0 },
    { id: "2", roleName: "gestionnaire", level: 1 },
    { id: "3", roleName: "admin", level: 2 },
  ];

  for (const role of roles) {
    await query(
      `INSERT INTO roles (id, roleName, level)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE roleName = VALUES(roleName), level = VALUES(level)` as string,
      [role.id, role.roleName, role.level]
    );
  }
}

async function seedAdmin() {
  if (adminSeeded) return;
  adminSeeded = true;

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.log("ℹ️  ADMIN_USERNAME/ADMIN_PASSWORD non fournis, skipping admin seed");
    return;
  }

  const existing = (await query(
    "SELECT id FROM users WHERE username = ?",
    [adminUsername]
  )) as Array<{ id: string }>;

  if (existing.length > 0) {
    console.log(`ℹ️  Admin '${adminUsername}' existe déjà, aucune action.`);
    return;
  }

  const hashed = await hashPassword(adminPassword);
  const userId = randomUUID();

  await query(
    `INSERT INTO users (id, username, password, role, settings, createdAt)
     VALUES (?, ?, ?, ?, '{}', NOW())`,
    [userId, adminUsername, hashed, "3"]
  );

  console.log(`✅ Admin '${adminUsername}' créé (id=${userId})`);
}

export async function initializeDatabase() {
  // Éviter les initialisations multiples simultanées
  if (isInitialized) return;
  isInitialized = true;
  try {
    // Créer la table des rôles (structure statique pour les niveaux d'accès)
    await query(`
      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(36) PRIMARY KEY,
        roleName VARCHAR(50) NOT NULL UNIQUE,
        level INT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Créer la table des utilisateurs pour le login
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(36) NOT NULL,
        settings JSON DEFAULT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_users_role FOREIGN KEY (role) REFERENCES roles(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Créer la table revenues
    await query(`
      CREATE TABLE IF NOT EXISTS revenues (
        id VARCHAR(36) PRIMARY KEY,
        date DATE NOT NULL,
        base20 DECIMAL(10, 2) NOT NULL DEFAULT 0,
        tva20 DECIMAL(10, 2) NOT NULL DEFAULT 0,
        base5_5 DECIMAL(10, 2) NOT NULL DEFAULT 0,
        tva5_5 DECIMAL(10, 2) NOT NULL DEFAULT 0,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Créer la table purchases
    await query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id VARCHAR(36) PRIMARY KEY,
        date DATE NOT NULL,
        totalHT DECIMAL(10, 2) NOT NULL DEFAULT 0,
        tva DECIMAL(10, 2) NOT NULL DEFAULT 0,
        shippingFee DECIMAL(10, 2) NOT NULL DEFAULT 0,
        totalTTC DECIMAL(10, 2) NOT NULL DEFAULT 0,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Seed roles + admin (si variables présentes)
    await seedRoles();
    await seedAdmin();

    console.log("✅ Database tables initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    throw error;
  }
}
