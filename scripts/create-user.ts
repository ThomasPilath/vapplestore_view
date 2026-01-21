#!/usr/bin/env node

/**
 * Script pour créer un utilisateur dans la base de données
 * Usage: bun run scripts/create-user.ts <username> <password> <roleId>
 * 
 * Rôles disponibles (comme dans l'image fournie):
 * - vendeur: level 0
 * - gestionnaire: level 1
 * - admin: level 2
 */

import { randomUUID } from "crypto";
import { query, closeDB } from "../lib/db";
import { hashPassword } from "../lib/auth";

async function createUser(username: string, password: string, roleName: string) {
  try {
    console.log("🔐 Création d'un nouvel utilisateur...");

    // Vérifier si l'utilisateur existe déjà
    const existingUsers = await query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    ) as any[];

    if (existingUsers.length > 0) {
      console.error(`❌ L'utilisateur "${username}" existe déjà`);
      process.exit(1);
    }

    // Récupérer le rôle
    const roles = await query(
      "SELECT id, roleName, level FROM roles WHERE LOWER(roleName) = LOWER(?)",
      [roleName]
    ) as any[];

    if (roles.length === 0) {
      console.error(`❌ Le rôle "${roleName}" n'existe pas`);
      console.log("\n📋 Rôles disponibles:");
      const allRoles = await query("SELECT roleName, level FROM roles ORDER BY level") as any[];
      allRoles.forEach((r: any) => {
        console.log(`  - ${r.roleName} (level: ${r.level})`);
      });
      process.exit(1);
    }

    const role = roles[0];

    // Hasher le mot de passe
    console.log("🔒 Hashage du mot de passe...");
    const hashedPassword = await hashPassword(password);

    // Créer l'utilisateur
    const userId = randomUUID();
    await query(
      `INSERT INTO users (id, username, password, role, createdAt)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, username, hashedPassword, role.id]
    );

    console.log("\n✅ Utilisateur créé avec succès!");
    console.log(`📋 Détails:`);
    console.log(`   - ID: ${userId}`);
    console.log(`   - Username: ${username}`);
    console.log(`   - Rôle: ${role.roleName} (level ${role.level})`);

  } catch (error) {
    console.error("❌ Erreur lors de la création de l'utilisateur:", error);
    process.exit(1);
  } finally {
    await closeDB();
  }
}

async function initRoles() {
  console.log("🔧 Initialisation des rôles...");
  
  const roles = [
    { id: randomUUID(), roleName: "vendeur", level: 0 },
    { id: randomUUID(), roleName: "gestionnaire", level: 1 },
    { id: randomUUID(), roleName: "admin", level: 2 },
  ];

  for (const role of roles) {
    const existing = await query(
      "SELECT id FROM roles WHERE LOWER(roleName) = LOWER(?)",
      [role.roleName]
    ) as any[];

    if (existing.length === 0) {
      await query(
        "INSERT INTO roles (id, roleName, level) VALUES (?, ?, ?)",
        [role.id, role.roleName, role.level]
      );
      console.log(`  ✓ Rôle "${role.roleName}" créé`);
    }
  }
}

// Main
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
  console.log(`
📝 Usage: bun run scripts/create-user.ts <username> <password> <role>

Arguments:
  username   Nom d'utilisateur (unique)
  password   Mot de passe (sera hashé automatiquement)
  role       Nom du rôle (vendeur, gestionnaire, ou admin)

Exemples:
  bun run scripts/create-user.ts admin monMotDePasse admin
  bun run scripts/create-user.ts john secret123 gestionnaire
  bun run scripts/create-user.ts marie pass456 vendeur

Pour initialiser les rôles uniquement:
  bun run scripts/create-user.ts --init-roles
  `);
  process.exit(0);
}

if (args[0] === "--init-roles") {
  initRoles().then(() => {
    console.log("✅ Rôles initialisés");
    closeDB();
  });
} else if (args.length < 3) {
  console.error("❌ Arguments manquants");
  console.log("Usage: bun run scripts/create-user.ts <username> <password> <role>");
  console.log('Pour plus d\'aide: bun run scripts/create-user.ts --help');
  process.exit(1);
} else {
  const [username, password, roleName] = args;
  
  // Initialiser les rôles d'abord si nécessaire
  initRoles().then(() => {
    return createUser(username, password, roleName);
  });
}
