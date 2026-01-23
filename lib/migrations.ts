/**
 * Système de migrations versionnées
 * Garde trace des migrations appliquées et permet des rollbacks
 */

import { query } from "@/lib/db";
import logger from "@/lib/logger";

export interface Migration {
  version: number;
  name: string;
  up: () => Promise<void>;
  down?: () => Promise<void>;
}

/**
 * Crée la table de suivi des migrations
 */
async function createMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      appliedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

/**
 * Récupère la version actuelle de la DB
 */
async function getCurrentVersion(): Promise<number> {
  try {
    const result = await query(
      "SELECT MAX(version) as version FROM schema_migrations"
    ) as Array<{version: number | null}>;
    return result[0]?.version || 0;
  } catch {
    return 0;
  }
}

/**
 * Enregistre une migration appliquée
 */
async function recordMigration(version: number, name: string) {
  await query(
    "INSERT INTO schema_migrations (version, name) VALUES (?, ?)",
    [version, name]
  );
}

/**
 * Supprime l'enregistrement d'une migration (rollback)
 */
async function removeMigration(version: number) {
  await query("DELETE FROM schema_migrations WHERE version = ?", [version]);
}

/**
 * Exécute toutes les migrations en attente
 */
export async function runMigrations(migrations: Migration[]) {
  await createMigrationsTable();
  const currentVersion = await getCurrentVersion();

  logger.info(`Version actuelle de la DB: ${currentVersion}`);

  const pendingMigrations = migrations
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  if (pendingMigrations.length === 0) {
    logger.info("Aucune migration en attente");
    return;
  }

  logger.info(`${pendingMigrations.length} migration(s) à appliquer`);

  for (const migration of pendingMigrations) {
    try {
      logger.info(`Application de la migration ${migration.version}: ${migration.name}`);
      await migration.up();
      await recordMigration(migration.version, migration.name);
      logger.success(`Migration ${migration.version} appliquée avec succès`);
    } catch (error) {
      logger.error(`Échec de la migration ${migration.version}`, error);
      throw error;
    }
  }

  logger.success("Toutes les migrations ont été appliquées");
}

/**
 * Rollback d'une migration
 */
export async function rollbackMigration(migrations: Migration[], targetVersion?: number) {
  const currentVersion = await getCurrentVersion();

  if (currentVersion === 0) {
    logger.warn("Aucune migration à annuler");
    return;
  }

  const target = targetVersion || currentVersion - 1;
  const migrationsToRollback = migrations
    .filter((m) => m.version > target && m.version <= currentVersion)
    .sort((a, b) => b.version - a.version);

  for (const migration of migrationsToRollback) {
    if (!migration.down) {
      logger.warn(`Pas de rollback défini pour la migration ${migration.version}`);
      continue;
    }

    try {
      logger.info(`Rollback de la migration ${migration.version}: ${migration.name}`);
      await migration.down();
      await removeMigration(migration.version);
      logger.success(`Migration ${migration.version} annulée`);
    } catch (error) {
      logger.error(`Échec du rollback de la migration ${migration.version}`, error);
      throw error;
    }
  }
}
