/**
 * Sentry configuration pour l'error monitoring et performance tracking
 * Integration optionnelle avec Sentry.io ou similaire (DataDog, etc.)
 * 
 * Installation:
 * bun add @sentry/nextjs @sentry/integrations
 * 
 * Configuration:
 * 1. Créer un compte Sentry.io (https://sentry.io)
 * 2. Ajouter dans .env.local :
 *    SENTRY_DSN=https://...@sentry.io/...
 *    SENTRY_ENVIRONMENT=production
 *    SENTRY_TRACE_SAMPLE_RATE=0.1
 *    SENTRY_PROFILE_SAMPLE_RATE=0.1
 */

// @ts-expect-error - Module optionnel, installer avec: bun add @sentry/nextjs
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;
const environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development";
const traceSampleRate = parseFloat(process.env.SENTRY_TRACE_SAMPLE_RATE || "0.1");
const profileSampleRate = parseFloat(process.env.SENTRY_PROFILE_SAMPLE_RATE || "0.1");
const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "unknown";

/**
 * Initialiser Sentry si DSN fourni
 */
if (dsn) {
  Sentry.init({
    dsn,
    environment,
    
    // Performance Monitoring - Fraction des requêtes à tracker
    tracesSampleRate: traceSampleRate,
    profilesSampleRate: profileSampleRate,
    
    // Error handling - Filtrer et traiter les erreurs
    beforeSend(event: unknown, hint: unknown) {
      const typedEvent = event as { level?: string };
      const typedHint = hint as { originalException?: Error };
      
      // Ne pas envoyer les erreurs de développement mineures
      if (environment === "development" && typedEvent.level === "info") {
        return null;
      }
      
      // Ne pas envoyer erreurs CSP de third-party scripts
      if (typedHint.originalException instanceof Error) {
        const message = typedHint.originalException.message;
        if (
          message.includes("Script error") ||
          message.includes("NetworkError") ||
          message.includes("Non-Error promise rejection")
        ) {
          return null;
        }
      }
      
      return event;
    },
    
    // Integrations
    integrations: [
      // Session Replay - Enregistrer les interactions utilisateur (sécurisé)
      new Sentry.Replay({
        maskAllText: true,          // Masquer le texte sensible
        blockAllMedia: true,         // Ne pas envoyer les médias
        maskAllInputs: true,         // Masquer les inputs sensibles
      }),
    ],
    
    // Release tracking pour les déploiements
    release: appVersion,
    
    // Erreurs à ignorer (false positives, spammeurs, etc.)
    ignoreErrors: [
      // Erreurs réseau génériques
      "Non-Error promise rejection captured",
      "AbortError",
      "NetworkError",
      "Network request failed",
      "fetch failed",
      "Client offline",
      
      // Erreurs de navigation
      "Navigation to",
      "404",
      
      // Erreurs CSP (third-party scripts)
      "Script error",
      "Non-Error promise",
      
      // Erreurs utilisateur (gérer dans le code)
      "User cancelled",
      "User dismissed",
    ],
    
    // Breadcrumbs - Tracer les événements importants
    maxBreadcrumbs: 50,
    
    // Source maps pour better stack traces
    // Attention: les source maps exposent votre code source en production
    // Utiliser uniquement avec un serveur Sentry privé
    attachStacktrace: true,
    
    // Timeout pour les connexions
    maxValueLength: 1024,
    
    // Tags par défaut pour filtrer les erreurs
    tags: {
      version: appVersion,
      environment,
    },
  });
}

/**
 * Wrapper pour capturer les erreurs serveur (API routes)
 * Usage: try { ... } catch (error) { captureException(error); }
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, unknown>
) {
  if (!dsn) return; // Sentry non configuré
  
  if (error instanceof Error) {
    Sentry.captureException(error, {
      tags: {
        severity: "error",
      },
      contexts: context ? { custom: context } : undefined,
    });
  } else {
    Sentry.captureException(new Error(String(error)), {
      tags: {
        severity: "warning",
      },
    });
  }
}

/**
 * Capturer les messages importants (non-errors)
 * Usage: captureMessage("User performed important action", "info")
 */
export function captureMessage(
  message: string,
  level: "debug" | "info" | "warning" | "error" = "info"
) {
  if (!dsn) return; // Sentry non configuré
  
  Sentry.captureMessage(message, level);
}

/**
 * Setters pour ajouter du contexte aux erreurs
 */
export const SentryContext = {
  setUser: (userId: string, username: string, role: string) => {
    if (!dsn) return;
    Sentry.setUser({
      id: userId,
      username,
      role,
    });
  },
  
  setTag: (key: string, value: string | number | boolean) => {
    if (!dsn) return;
    Sentry.setTag(key, value);
  },
  
  addBreadcrumb: (
    message: string,
    category: string = "user-action",
    level: "debug" | "info" | "warning" | "error" = "info"
  ) => {
    if (!dsn) return;
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      timestamp: Date.now() / 1000,
    });
  },
};

/**
 * Statut d'initialisation
 */
export const isSentryEnabled = !!dsn;
export default Sentry;
