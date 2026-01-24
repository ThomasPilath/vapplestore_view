/**
 * Composant client pour déclencher l'initialisation DB au démarrage
 * Appelé automatiquement au chargement du layout root
 */
"use client";

import { useEffect } from "react";

export function DatabaseChecker() {
  useEffect(() => {
    // Déclencher l'initialisation de la DB au premier chargement
    // Cette route n'a pas besoin d'authentification
    fetch("/api/init-db", {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          console.log("✅ Database initialized:", data.message);
        } else {
          console.warn("⚠️ Database init:", data.error);
        }
      })
      .catch((error) => {
        console.error("❌ Database initialization failed:", error);
      });
  }, []);

  return null; // Ce composant ne rend rien
}
