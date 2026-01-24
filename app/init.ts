/**
 * Initialisation au démarrage du serveur
 * Importé dans le layout.tsx pour garantir l'exécution au démarrage
 */

import { initializeDatabaseAtStartup } from "@/lib/db-startup";

// Variable pour tracker si l'initialisation a été lancée
let initPromise: Promise<void> | null = null;

/**
 * Déclenche l'initialisation de la DB une seule fois
 * Peut être appelée multiple fois, n'exécute qu'une seule fois grâce à initPromise
 */
export async function ensureDatabaseInitialized() {
  if (!initPromise) {
    initPromise = initializeDatabaseAtStartup();
  }
  return initPromise;
}

// Démarrer l'initialisation immédiatement à l'import du module
ensureDatabaseInitialized().catch((error) => {
  console.error("❌ Failed to initialize database at startup:", error);
});
