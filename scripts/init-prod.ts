#!/usr/bin/env bun

/**
 * Script d'initialisation pour la production
 * Crée les rôles et l'utilisateur admin
 * 
 * Usage: bun run scripts/init-prod.ts
 */

import { query, closeDB } from "../lib/db";
import { hashPassword } from "../lib/auth";
import { randomUUID } from "crypto";

async function initRoles() {
  console.log("🔧 Initialisation des rôles...");
  
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
      ) as any[];

      if (existing.length === 0) {
        await query(
          "INSERT INTO roles (id, roleName, level) VALUES (?, ?, ?)",
          [role.id, role.roleName, role.level]
        );
        console.log(`  ✓ Rôle "${role.roleName}" créé (ID: ${role.id}, level: ${role.level})`);
      } else {
        console.log(`  ⏭️  Rôle "${role.roleName}" existe déjà`);
      }
    } catch (error) {
      console.error(`  ❌ Erreur pour le rôle "${role.roleName}":`, error);
    }
  }
}

async function createAdminUser(username: string, password: string) {
  console.log("\n👤 Création de l'utilisateur admin...");
  
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUsers = await query(
      "SELECT id, username FROM users WHERE username = ?",
      [username]
    ) as any[];

    if (existingUsers.length > 0) {
      console.log(`  ⚠️  L'utilisateur "${username}" existe déjà (ID: ${existingUsers[0].id})`);
      console.log("  💡 Si vous souhaitez réinitialiser le mot de passe, supprimez d'abord cet utilisateur.");
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password);

    // Créer l'utilisateur admin (role ID = "3")
    const userId = randomUUID();
    await query(
      `INSERT INTO users (id, username, password, role, settings, createdAt)
       VALUES (?, ?, ?, ?, '{}', NOW())`,
      [userId, username, hashedPassword, "3"]
    );

    console.log("  ✅ Utilisateur admin créé avec succès!");
    console.log(`     - ID: ${userId}`);
    console.log(`     - Username: ${username}`);
    console.log(`     - Rôle: admin (level 2)`);
  } catch (error) {
    console.error("  ❌ Erreur lors de la création de l'utilisateur:", error);
    throw error;
  }
}

// Main
async function main() {
  console.log("🚀 Initialisation de la base de données pour la production\n");

  try {
    // 1. Créer les rôles
    await initRoles();

    // 2. Créer l'utilisateur admin
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "AdminPassword123";

    if (adminPassword === "AdminPassword123") {
      console.log("\n⚠️  ATTENTION: Vous utilisez le mot de passe par défaut!");
      console.log("   Pour plus de sécurité, définissez les variables d'environnement:");
      console.log("   ADMIN_USERNAME et ADMIN_PASSWORD\n");
    }

    await createAdminUser(adminUsername, adminPassword);

    console.log("\n✅ Initialisation terminée avec succès!");
    console.log("\n📋 Prochaines étapes:");
    console.log("   1. Connectez-vous avec les identifiants admin");
    console.log("   2. Créez d'autres utilisateurs depuis la page d'administration");
    console.log("   3. Changez le mot de passe admin si vous utilisez le mot de passe par défaut");

  } catch (error) {
    console.error("\n❌ Erreur lors de l'initialisation:", error);
    process.exit(1);
  } finally {
    await closeDB();
  }
}

main();
