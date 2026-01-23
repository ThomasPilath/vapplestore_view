/**
 * API Client pour les appels frontend vers les routes API
 * Utilise fetch avec configuration centralisée et authentification JWT
 */

import { useAuthStore } from "@/hook/auth.store";
import logger from "@/lib/logger";

export interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: object;
  headers?: Record<string, string>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Client API générique avec gestion d'erreurs standardisée et JWT
 */
export async function apiCall<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const logout = useAuthStore.getState().logout;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  const config: RequestInit = {
    method,
    headers: defaultHeaders,
    credentials: "include",
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const url = `${API_BASE_URL}/api${endpoint}`;
    logger.api(method, endpoint);

    let response = await fetch(url, config);

    // Si 401, tenter de rafraîchir la session via les cookies
    if (response.status === 401) {
      logger.info("🔄 Session expirée, tentative de rafraîchissement...");
      
      const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (refreshResponse.ok) {
        // Réessayer la requête avec les nouveaux cookies
        response = await fetch(url, config);
      } else {
        logout();
        throw new Error("Session expirée, veuillez vous reconnecter");
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `API error: ${response.statusText} (${response.status})`
      );
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Unknown error");
    }

    return data.data;
  } catch (error) {
    logger.error(`API call failed for ${endpoint}`, error);
    throw error;
  }
}

/**
 * Fonctions spécifiques pour Revenues
 */
export const revenueAPI = {
  getAll: () => apiCall<Record<string, unknown>>("/revenues"),
  getByMonth: (month: string) => apiCall<Record<string, unknown>>(`/revenues?month=${month}`),
  create: (data: object) => apiCall<Record<string, unknown>>("/revenues", { method: "POST", body: data }),
  deleteAll: () => apiCall<Record<string, unknown>>("/revenues", { method: "DELETE" }),
};

/**
 * Fonctions spécifiques pour Purchases
 */
export const purchaseAPI = {
  getAll: () => apiCall<Record<string, unknown>>("/purchases"),
  getByMonth: (month: string) => apiCall<Record<string, unknown>>(`/purchases?month=${month}`),
  create: (data: object) => apiCall<Record<string, unknown>>("/purchases", { method: "POST", body: data }),
  deleteAll: () => apiCall<Record<string, unknown>>("/purchases", { method: "DELETE" }),};