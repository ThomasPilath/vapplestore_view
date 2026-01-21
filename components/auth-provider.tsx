/**
 * AuthProvider - Composant de protection de l'application
 * Gère l'authentification, affiche la modale de login si nécessaire
 * et rafraîchit automatiquement les tokens
 */

"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/hook/auth.store";
import { storeSettings } from "@/hook/settings.store";
import { LoginModal } from "@/components/login-modal";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated, isLoading, accessToken, refreshToken, setAccessToken, logout, setLoading } = useAuthStore();

  // Fonction pour rafraîchir le token
  const refreshAccessToken = async () => {
    if (!refreshToken) {
      logout();
      return false;
    }

    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // Token expiré ou invalide, réinitialiser l'état
        setLoading(false);
        return false;
      }

      const data = await response.json();
      setAccessToken(data.accessToken);
      return true;
    } catch (error) {
      // En cas d'erreur réseau ou autre, déconnecter par sécurité
      logout();
      return false;
    }
  };

  // Vérifier l'authentification au montage
  useEffect(() => {
    const checkAuth = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      // Tester si le token est valide en faisant un appel simple
      try {
        const response = await fetch("/api/db-check", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 401) {
          // Token expiré, essayer de le rafraîchir
          const refreshed = await refreshAccessToken();
          if (!refreshed) {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        // En cas d'erreur, on considère l'utilisateur comme non authentifié
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Charger les settings utilisateur une fois authentifié
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadUserSettings = async () => {
      try {
        const response = await fetch("/api/user/settings", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            storeSettings.getState().loadSettings(data.data);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des settings:", error);
      }
    };

    loadUserSettings();
  }, [isAuthenticated, accessToken]);

  // Configurer le rafraîchissement automatique du token (toutes les 10 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      refreshAccessToken();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshToken]);

  // Afficher un écran de chargement pendant la vérification
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  // Afficher la modale de login si non authentifié
  if (!isAuthenticated) {
    return (
      <>
        <LoginModal open={true} />
        {/* Afficher un fond flou ou vide */}
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
      </>
    );
  }

  // Utilisateur authentifié, afficher l'application
  return <>{children}</>;
}
