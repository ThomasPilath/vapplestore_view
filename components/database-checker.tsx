/**
 * Composant client pour déclencher la vérification DB au chargement
 */
"use client";

import { useEffect } from "react";

export function DatabaseChecker() {
  useEffect(() => {
    // Déclencher la vérification de la DB au premier chargement
    fetch("/api/db-check")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          console.log("✅ Database structure verified:", data.message);
        }
      })
      .catch((error) => {
        console.error("❌ Database check failed:", error);
      });
  }, []);

  return null; // Ce composant ne rend rien
}
