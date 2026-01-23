/**
 * AuthProvider - Composant de protection de l'application
 * Gère l'authentification via cookies HttpOnly, affiche la modale de login si nécessaire
 * et rafraîchit automatiquement la session
 */

"use client";

import { useCallback, useEffect } from "react";
import { useAuthStore } from "@/hook/auth.store";
import { storeSettings } from "@/hook/settings.store";
import { LoginModal } from "@/components/login-modal";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated, isLoading, setAuth, logout, setLoading } = useAuthStore();

  const fetchCurrentUser = useCallback(async () => {
    const response = await fetch("/api/auth/me", { credentials: "include" });
    if (!response.ok) return null;
    const data = await response.json();
    return data.user;
  }, []);

  const refreshSession = useCallback(async () => {
    const response = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
    return response.ok;
  }, []);

  // Vérifier l'authentification au montage
  useEffect(() => {
    const checkAuth = async () => {
      try {
        let user = await fetchCurrentUser();

        if (!user) {
          const refreshed = await refreshSession();
          if (refreshed) {
            user = await fetchCurrentUser();
          }
        }

        if (user) {
          setAuth(user);
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [fetchCurrentUser, refreshSession, setAuth, logout, setLoading]);

  // Charger les settings utilisateur une fois authentifié
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadUserSettings = async () => {
      try {
        const response = await fetch("/api/user/settings", {
          credentials: "include",
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
  }, [isAuthenticated]);

  // Rafraîchir périodiquement la session (toutes les 10 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      refreshSession()
        .then((ok) => {
          if (!ok) logout();
        })
        .catch(() => logout());
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, logout, refreshSession]);

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
