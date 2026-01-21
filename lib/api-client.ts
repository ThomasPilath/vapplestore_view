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

  // Récupérer le token JWT depuis le store
  const accessToken = useAuthStore.getState().accessToken;
  const refreshToken = useAuthStore.getState().refreshToken;
  const setAccessToken = useAuthStore.getState().setAccessToken;
  const logout = useAuthStore.getState().logout;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  // Ajouter le token JWT si disponible
  if (accessToken) {
    defaultHeaders["Authorization"] = `Bearer ${accessToken}`;
  }

  const config: RequestInit = {
    method,
    headers: defaultHeaders,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const url = `${API_BASE_URL}/api${endpoint}`;
    logger.api(method, endpoint);

    let response = await fetch(url, config);

    // Si 401, tenter de rafraîchir le token
    if (response.status === 401 && refreshToken) {
      logger.info("🔄 Token expiré, tentative de rafraîchissement...");
      
      const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setAccessToken(refreshData.accessToken);
        
        // Réessayer la requête avec le nouveau token
        defaultHeaders["Authorization"] = `Bearer ${refreshData.accessToken}`;
        config.headers = defaultHeaders;
        response = await fetch(url, config);
      } else {
        // Refresh token invalide, déconnecter
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
  getAll: () => apiCall<any>("/revenues"),
  getByMonth: (month: string) => apiCall<any>(`/revenues?month=${month}`),
  create: (data: object) => apiCall<any>("/revenues", { method: "POST", body: data }),
  deleteAll: () => apiCall<any>("/revenues", { method: "DELETE" }),
};

/**
 * Fonctions spécifiques pour Purchases
 */
export const purchaseAPI = {
  getAll: () => apiCall<any>("/purchases"),
  getByMonth: (month: string) => apiCall<any>(`/purchases?month=${month}`),
  create: (data: object) => apiCall<any>("/purchases", { method: "POST", body: data }),
  deleteAll: () => apiCall<any>("/purchases", { method: "DELETE" }),
};
