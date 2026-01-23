/**
 * Helper pour les transactions de base de données
 * Permet d'exécuter plusieurs requêtes de manière atomique
 */

import { getDB } from "@/lib/db";
import type { PoolConnection } from "mysql2/promise";
import logger from "@/lib/logger";

export class Transaction {
  private connection: PoolConnection | null = null;
  private committed = false;
  private rolledBack = false;

  /**
   * Démarre une transaction
   */
  async begin(): Promise<void> {
    const pool = await getDB();
    this.connection = await pool.getConnection();
    await this.connection.beginTransaction();
    logger.debug("Transaction démarrée");
  }

  /**
   * Exécute une requête dans la transaction
   */
  async query(sql: string, values?: (string | number | boolean | null)[]): Promise<unknown> {
    if (!this.connection) {
      throw new Error("Transaction non démarrée. Appelez begin() d'abord.");
    }

    if (this.committed || this.rolledBack) {
      throw new Error("Transaction déjà terminée");
    }

    const [results] = await this.connection.execute(sql, values || []);
    return results;
  }

  /**
   * Valide la transaction
   */
  async commit(): Promise<void> {
    if (!this.connection) {
      throw new Error("Transaction non démarrée");
    }

    if (this.committed) {
      throw new Error("Transaction déjà validée");
    }

    if (this.rolledBack) {
      throw new Error("Transaction déjà annulée");
    }

    await this.connection.commit();
    this.committed = true;
    logger.debug("Transaction validée");
    this.release();
  }

  /**
   * Annule la transaction
   */
  async rollback(): Promise<void> {
    if (!this.connection) {
      return;
    }

    if (this.committed) {
      throw new Error("Impossible d'annuler une transaction validée");
    }

    if (!this.rolledBack) {
      await this.connection.rollback();
      this.rolledBack = true;
      logger.debug("Transaction annulée");
    }

    this.release();
  }

  /**
   * Libère la connexion
   */
  private release(): void {
    if (this.connection) {
      this.connection.release();
      this.connection = null;
    }
  }
}

/**
 * Helper pour exécuter du code dans une transaction automatique
 */
export async function withTransaction<T>(
  callback: (tx: Transaction) => Promise<T>
): Promise<T> {
  const tx = new Transaction();

  try {
    await tx.begin();
    const result = await callback(tx);
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    logger.error("Erreur dans la transaction, rollback effectué", error);
    throw error;
  }
}
