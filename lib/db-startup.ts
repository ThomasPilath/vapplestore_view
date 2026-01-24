/**
 * Initialisation de la base de données au démarrage du serveur
 * S'exécute automatiquement quand le serveur Next.js démarre
 */

import { getDB, query } from "./db";
import { hashPassword } from "./auth";
import { randomUUID } from "crypto";

let startupInitialized = false;

async function seedRoles() {
  console.log("\n🔧 [STARTUP] Initialisation des rôles...");
  
  const roles = [
    { id: "1", roleName: "vendeur", level: 0 },
    { id: "2", roleName: "gestionnaire", level: 1 },
    { id: "3", roleName: "admin", level: 2 },
  ];

  for (const role of roles) {
    try {
      const existing = await query(
        "SELECT id FROM roles WHERE id = ?",
        [role.id]
      ) as Array<{ id: string }>;

      if (existing.length === 0) {
        await query(
          "INSERT INTO roles (id, roleName, level) VALUES (?, ?, ?)",
          [role.id, role.roleName, role.level]
        );
        console.log(`  ✓ Rôle "${role.roleName}" créé (ID: ${role.id}, level: ${role.level})`);
      } else {
        console.log(`  ℹ️  Rôle "${role.roleName}" existe déjà (ID: ${role.id})`);
      }
    } catch (error) {
      console.error(`  ❌ Erreur pour le rôle "${role.roleName}":`, error);
      throw error;
    }
  }
  
  console.log("✅ [STARTUP] Rôles initialisés");
}

async function seedAdmin() {
  console.log("\n👤 [STARTUP] Initialisation de l'utilisateur admin...");
  
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.warn(
      "⚠️  [STARTUP] Variables ADMIN_USERNAME/ADMIN_PASSWORD manquantes, admin non créé"
    );
    return;
  }

  console.log(`  🔍 Vérification si l'utilisateur '${adminUsername}' existe...`);
  
  try {
    const existing = await query(
      "SELECT id, username FROM users WHERE username = ?",
      [adminUsername]
    ) as Array<{ id: string; username: string }>;

    if (existing.length > 0) {
      console.log(`  ✓ Admin '${adminUsername}' existe déjà (id: ${existing[0].id})`);
      return;
    }

    console.log(`  🔐 Hashage du mot de passe pour '${adminUsername}'...`);
    const hashedPassword = await hashPassword(adminPassword);
    const userId = randomUUID();

    console.log(`  💾 Création de l'utilisateur admin dans la base de données...`);
    await query(
      `INSERT INTO users (id, username, password, role, settings, createdAt)
       VALUES (?, ?, ?, ?, '{}', NOW())`,
      [userId, adminUsername, hashedPassword, "3"]
    );

    console.log(`✅ [STARTUP] Admin '${adminUsername}' créé avec succès`);
    console.log(`   ID: ${userId}`);
    console.log(`   Rôle: admin (level 3)`);
  } catch (error) {
    console.error(`  ❌ Erreur lors de la création de l'admin:`, error);
    throw error;
  }
}

async function createTablesIfNotExist() {
  console.log("\n📋 [STARTUP] Création des tables si nécessaire...");

  try {
    // Table des rôles
    await query(`
      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(36) PRIMARY KEY,
        roleName VARCHAR(50) NOT NULL UNIQUE,
        level INT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("  ✓ Table 'roles' vérifiée/créée");

    // Table des utilisateurs
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
    console.log("  ✓ Table 'users' vérifiée/créée");

    // Vérifier et ajouter la colonne settings si elle n'existe pas
    try {
      await query(`
        ALTER TABLE users ADD COLUMN settings JSON DEFAULT NULL
      `);
      console.log("  ✓ Colonne 'settings' ajoutée à la table users");
    } catch (error: any) {
      // Si l'erreur est "Duplicate column", c'est OK, la colonne existe déjà
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log("  ℹ️  Colonne 'settings' existe déjà dans users");
      } else {
        // Autre erreur, on la log mais on continue
        console.warn("  ⚠️  Erreur lors de l'ajout de 'settings':", error.message);
      }
    }

    // Table des revenues
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
    console.log("  ✓ Table 'revenues' vérifiée/créée");

    // Table des purchases
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
    console.log("  ✓ Table 'purchases' vérifiée/créée");

    // Table audit
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36),
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100),
        changes JSON,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_audit_user FOREIGN KEY (userId) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("  ✓ Table 'audit_logs' vérifiée/créée");

    console.log("✅ [STARTUP] Toutes les tables créées/vérifiées");
  } catch (error) {
    console.error("❌ [STARTUP] Erreur lors de la création des tables:", error);
    throw error;
  }
}

/**
 * Fonction principale d'initialisation au démarrage
 * Appelée une seule fois lors du démarrage du serveur
 */
export async function initializeDatabaseAtStartup() {
  if (startupInitialized) {
    console.log("ℹ️  [STARTUP] Initialisation déjà effectuée, skipping");
    return;
  }

  startupInitialized = true;

  console.log("\n" + "=".repeat(60));
  console.log("🚀 [STARTUP] Démarrage de l'initialisation de la base de données");
  console.log("=".repeat(60));

  try {
    // 1. Établir la connexion au pool
    console.log("\n🔌 [STARTUP] Établissement de la connexion au pool...");
    const db = await getDB();
    console.log("✅ [STARTUP] Connexion au pool établie");

    // 2. Créer les tables si nécessaire
    await createTablesIfNotExist();

    // 3. Initialiser les rôles
    await seedRoles();

    // 4. Initialiser l'admin
    await seedAdmin();

    console.log("\n" + "=".repeat(60));
    console.log("✅ [STARTUP] Initialisation complète de la base de données");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error(
      "\n❌ [STARTUP] Erreur critique lors de l'initialisation:",
      error
    );
    console.error("⚠️  [STARTUP] L'application ne peut pas démarrer sans la base de données");
    // Ne pas relancer l'erreur, laisser le serveur démarrer mais il sera instable
    // Les requêtes échoueront jusqu'à ce que la DB soit prête
  }
}
