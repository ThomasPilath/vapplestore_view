#!/usr/bin/env bun

/**
 * Script de migration pour ajouter la colonne settings à la table users
 * Usage: bun run scripts/migrate-add-settings.ts
 */

import { query, closeDB } from "../lib/db";

async function migrate() {
  console.log("🔄 Migration: Ajout de la colonne settings à la table users\n");

  try {
    // Vérifier si la colonne existe déjà
    const columns = await query(
      "SHOW COLUMNS FROM users WHERE Field = 'settings'"
    ) as Array<Record<string, unknown>>;

    if (columns.length > 0) {
      console.log("✅ La colonne 'settings' existe déjà, migration non nécessaire.");
      return;
    }

    // Ajouter la colonne settings
    console.log("📝 Ajout de la colonne 'settings'...");
    await query(
      "ALTER TABLE users ADD COLUMN settings JSON DEFAULT NULL"
    );

    console.log("✅ Colonne 'settings' ajoutée avec succès!");

    // Initialiser les settings pour les utilisateurs existants
    console.log("📝 Initialisation des settings pour les utilisateurs existants...");
    await query(
      "UPDATE users SET settings = '{}' WHERE settings IS NULL"
    );

    console.log("✅ Settings initialisés pour tous les utilisateurs");
    console.log("\n✅ Migration terminée avec succès!");

  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    throw error;
  } finally {
    await closeDB();
  }
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
