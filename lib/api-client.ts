/**
 * API Client pour les appels frontend vers les routes API
 * Utilise fetch avec configuration centralisée
 */

export interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: object;
  headers?: Record<string, string>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Client API générique avec gestion d'erreurs standardisée
 */
export async function apiCall<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  const config: RequestInit = {
    method,
    headers: defaultHeaders,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const url = `${API_BASE_URL}/api${endpoint}`;
    console.log(`📡 ${method} ${url}`);

    const response = await fetch(url, config);

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
    console.error(`❌ API call failed for ${endpoint}:`, error);
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
