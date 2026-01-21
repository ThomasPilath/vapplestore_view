#!/usr/bin/env bun

/**
 * Script de test de connexion à la base de données
 * Usage: bun run scripts/test-db.ts
 */

import { query, closeDB } from "../lib/db";

async function testConnection() {
  console.log("🔍 Test de connexion à la base de données\n");

  try {
    // Test de connexion basique
    console.log("📡 Test de connexion...");
    const result = await query("SELECT 1 as test") as any[];
    
    if (result[0]?.test === 1) {
      console.log("✅ Connexion réussie !\n");
    }

    // Vérifier les tables existantes
    console.log("📋 Tables existantes:");
    const tables = await query("SHOW TABLES") as any[];
    
    if (tables.length === 0) {
      console.log("   ⚠️  Aucune table trouvée");
      console.log("   💡 Exécutez : curl http://localhost:3000/api/init");
    } else {
      tables.forEach((table: any) => {
        const tableName = Object.values(table)[0];
        console.log(`   - ${tableName}`);
      });
    }

    // Vérifier les rôles
    console.log("\n👥 Rôles:");
    try {
      const roles = await query("SELECT id, roleName, level FROM roles ORDER BY level") as any[];
      if (roles.length === 0) {
        console.log("   ⚠️  Aucun rôle trouvé");
        console.log("   💡 Exécutez : bun run scripts/init-prod.ts");
      } else {
        roles.forEach((role: any) => {
          console.log(`   - ${role.roleName} (ID: ${role.id}, level: ${role.level})`);
        });
      }
    } catch (error: any) {
      if (error.code === "ER_NO_SUCH_TABLE") {
        console.log("   ⚠️  Table 'roles' n'existe pas");
      } else {
        throw error;
      }
    }

    // Vérifier les utilisateurs
    console.log("\n👤 Utilisateurs:");
    try {
      const users = await query(
        `SELECT u.id, u.username, r.roleName, u.createdAt
         FROM users u
         LEFT JOIN roles r ON u.role = r.id
         ORDER BY u.createdAt DESC
         LIMIT 10`
      ) as any[];
      
      if (users.length === 0) {
        console.log("   ⚠️  Aucun utilisateur trouvé");
        console.log("   💡 Exécutez : bun run scripts/init-prod.ts");
      } else {
        users.forEach((user: any) => {
          console.log(`   - ${user.username} (${user.roleName || "Rôle inconnu"})`);
        });
        if (users.length === 10) {
          console.log("   ... (limité à 10 résultats)");
        }
      }
    } catch (error: any) {
      if (error.code === "ER_NO_SUCH_TABLE") {
        console.log("   ⚠️  Table 'users' n'existe pas");
      } else {
        throw error;
      }
    }

    // Statistiques des données
    console.log("\n📊 Données:");
    try {
      const revenuesCount = await query("SELECT COUNT(*) as count FROM revenues") as any[];
      const purchasesCount = await query("SELECT COUNT(*) as count FROM purchases") as any[];
      console.log(`   - Revenues: ${revenuesCount[0]?.count || 0} entrées`);
      console.log(`   - Purchases: ${purchasesCount[0]?.count || 0} entrées`);
    } catch (error: any) {
      if (error.code === "ER_NO_SUCH_TABLE") {
        console.log("   ⚠️  Tables revenues/purchases n'existent pas");
      } else {
        throw error;
      }
    }

    console.log("\n✅ Test terminé avec succès !");
    console.log("\n📋 Configuration actuelle:");
    console.log(`   - Host: ${process.env.DATABASE_HOST || "localhost"}`);
    console.log(`   - Port: ${process.env.DATABASE_PORT || "3306"}`);
    console.log(`   - Database: ${process.env.DATABASE_NAME || "vapplestore"}`);
    console.log(`   - User: ${process.env.DATABASE_USER || "root"}`);

  } catch (error: any) {
    console.error("\n❌ Erreur de connexion:", error.message);
    console.error("\n🔧 Vérifiez votre configuration:");
    console.error("   1. Les variables d'environnement dans .env.local");
    console.error("   2. Que le serveur de base de données est démarré");
    console.error("   3. Que les credentials sont corrects");
    process.exit(1);
  } finally {
    await closeDB();
  }
}

testConnection();
