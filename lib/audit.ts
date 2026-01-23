/**
 * Service d'audit trail
 * Enregistre toutes les actions importantes des utilisateurs
 */

import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import logger from "@/lib/logger";

export interface AuditEntry {
  userId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "VIEW";
  tableName: string;
  recordId?: string;
  changes?: Record<string, string | number | boolean | null | undefined>;
  ip?: string;
  userAgent?: string;
}

/**
 * Enregistre une entrée d'audit
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const id = randomUUID();
    
    await query(
      `INSERT INTO audit_log (id, userId, action, tableName, recordId, changes, ip, userAgent, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        entry.userId,
        entry.action,
        entry.tableName,
        entry.recordId || null,
        entry.changes ? JSON.stringify(entry.changes) : null,
        entry.ip || null,
        entry.userAgent || null,
      ]
    );

    logger.audit(entry.action, entry.userId, entry.tableName, {
      recordId: entry.recordId,
      ip: entry.ip,
    });
  } catch (error) {
    // Ne pas bloquer l'opération si l'audit échoue
    logger.error("Erreur lors de l'enregistrement de l'audit", error);
  }
}

/**
 * Récupère l'historique d'audit pour un utilisateur
 */
export async function getUserAuditHistory(
  userId: string,
  limit: number = 100
): Promise<Record<string, unknown>[]> {
  const results = await query(
    `SELECT * FROM audit_log 
     WHERE userId = ? 
     ORDER BY createdAt DESC 
     LIMIT ?`,
    [userId, limit]
  );
  
  return results;
}

/**
 * Récupère l'historique d'audit pour un enregistrement spécifique
 */
export async function getRecordAuditHistory(
  tableName: string,
  recordId: string
): Promise<Record<string, unknown>[]> {
  const results = await query(
    `SELECT * FROM audit_log 
     WHERE tableName = ? AND recordId = ? 
     ORDER BY createdAt DESC`,
    [tableName, recordId]
  );
  
  return results;
}
