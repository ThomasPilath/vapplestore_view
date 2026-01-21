/**
 * Système de logging centralisé
 * Permet de contrôler les logs selon l'environnement
 */

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const IS_DEV = process.env.NODE_ENV === "development";

export const logger = {
  /**
   * Log d'information (développement seulement)
   */
  info: (...args: any[]) => {
    if (IS_DEV) {
      console.log(...args);
    }
  },

  /**
   * Log de succès (développement seulement)
   */
  success: (message: string, ...args: any[]) => {
    if (IS_DEV) {
      console.log(`✅ ${message}`, ...args);
    }
  },

  /**
   * Log d'erreur (toujours actif)
   */
  error: (message: string, error?: any) => {
    console.error(`❌ ${message}`, error);
    // En production, vous pouvez envoyer vers un service de monitoring
    // comme Sentry, LogRocket, etc.
  },

  /**
   * Log d'avertissement
   */
  warn: (message: string, ...args: any[]) => {
    console.warn(`⚠️  ${message}`, ...args);
  },

  /**
   * Log de debug (développement seulement)
   */
  debug: (...args: any[]) => {
    if (IS_DEV) {
      console.debug("🐛", ...args);
    }
  },

  /**
   * Log API (développement seulement)
   */
  api: (method: string, endpoint: string, status?: number) => {
    if (IS_DEV) {
      const emoji = status && status >= 400 ? "❌" : "📡";
      console.log(`${emoji} ${method} ${endpoint}${status ? ` → ${status}` : ""}`);
    }
  },
};

export default logger;
