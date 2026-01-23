/**
 * Système de logging centralisé avec contexte
 * Permet de contrôler les logs selon l'environnement et d'ajouter du contexte
 */

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const IS_DEV = process.env.NODE_ENV === "development";

interface LogContext {
  userId?: string;
  action?: string;
  resource?: string;
  ip?: string;
  [key: string]: string | number | boolean | null | undefined;
}

function formatLog(level: string, message: string, context?: LogContext, error?: unknown) {
  const timestamp = new Date().toISOString();
  const errorValue = error instanceof Error ? error.message : (error as string);
  const logEntry: Record<string, unknown> = {
    timestamp,
    level,
    message,
  };
  
  if (context) {
    logEntry.context = context;
  }
  
  if (error) {
    logEntry.error = errorValue;
  }

  // En production, vous pouvez envoyer vers un service de monitoring
  // comme Sentry, DataDog, CloudWatch, etc.
  if (IS_PRODUCTION) {
    // TODO: Intégrer avec votre service de logging
    // await sendToLoggingService(logEntry);
  }

  return logEntry;
}

export const logger = {
  /**
   * Log d'information avec contexte
   */
  info: (message: string, context?: LogContext) => {
    if (IS_DEV) {
      console.log(`ℹ️  ${message}`, context || "");
    }
    return formatLog("info", message, context);
  },

  /**
   * Log de succès avec contexte
   */
  success: (message: string, context?: LogContext) => {
    if (IS_DEV) {
      console.log(`✅ ${message}`, context || "");
    }
    return formatLog("success", message, context);
  },

  /**
   * Log d'erreur (toujours actif) avec contexte
   */
  error: (message: string, error?: unknown, context?: LogContext) => {
    const logEntry = formatLog("error", message, context, error);
    console.error(`❌ ${message}`, { error, ...context });
    return logEntry;
  },

  /**
   * Log d'avertissement avec contexte
   */
  warn: (message: string, context?: LogContext) => {
    const logEntry = formatLog("warn", message, context);
    console.warn(`⚠️  ${message}`, context || "");
    return logEntry;
  },

  /**
   * Log de debug (développement seulement)
   */
  debug: (message: string, context?: LogContext) => {
    if (IS_DEV) {
      console.debug("🐛", message, context || "");
    }
    return formatLog("debug", message, context);
  },

  /**
   * Log API avec contexte
   */
  api: (method: string, endpoint: string, status?: number, context?: LogContext) => {
    const emoji = status && status >= 400 ? "❌" : "📡";
    const message = `${method} ${endpoint}${status ? ` → ${status}` : ""}`;
    if (IS_DEV) {
      console.log(`${emoji} ${message}`, context || "");
    }
    return formatLog("api", message, context);
  },

  /**
   * Log d'audit pour tracer les actions utilisateurs
   */
  audit: (action: string, userId: string, resource: string, details?: Record<string, unknown>) => {
    const message = `Audit: ${action} on ${resource} by ${userId}`;
    const context = { userId, action, resource, ...details };
    
    // Toujours logger les audits, même en production
    console.log(`🔍 ${message}`, context);
    
    return formatLog("audit", message, context);
  },
};

export default logger;
