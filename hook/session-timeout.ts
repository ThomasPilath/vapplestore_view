/**
 * Session Timeout Handler - Logout après inactivité
 * 
 * Utilisation:
 * useSessionTimeout(inactivityMinutes)
 * 
 * Exemple:
 * useSessionTimeout(15); // Logout après 15 minutes d'inactivité
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "./auth.store";

export function useSessionTimeout(inactivityMinutes: number = 30) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number | null>(null);
  const { user, logout } = useAuthStore();

  // Initialiser l'activité au premier rendu
  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const handleSessionTimeout = useCallback(async () => {
    console.warn(`Session timeout after ${inactivityMinutes} minutes of inactivity`);
    
    // Logout l'utilisateur
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignorer les erreurs de logout
    }
    
    // Effacer state auth
    logout();
    
    // Rediriger à login
    window.location.href = "/";
  }, [inactivityMinutes, logout]);

  const resetTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Effacer timeout précédent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Définir nouveau timeout
    timeoutRef.current = setTimeout(() => {
      handleSessionTimeout();
    }, inactivityMinutes * 60 * 1000);
  }, [inactivityMinutes, handleSessionTimeout]);

  useEffect(() => {
    if (!user) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Initialiser le timeout
    resetTimeout();

    // Écouter activités utilisateur
    const events = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "mousemove",
    ];

    const handleActivity = () => {
      resetTimeout();
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [user, inactivityMinutes, logout, resetTimeout]);
}

/**
 * Hook pour afficher une notification avant timeout
 * 
 * Utilisation:
 * useSessionWarning(inactivityMinutes, warningBeforeMinutes)
 */
export function useSessionWarning(
  inactivityMinutes: number = 30,
  warningBeforeMinutes: number = 5
) {
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const lastActivityRef = useRef<number | null>(null);
  const { user } = useAuthStore();

  const resetWarning = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);

    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    const warningTime =
      (inactivityMinutes - warningBeforeMinutes) * 60 * 1000;
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
    }, warningTime);
  }, [inactivityMinutes, warningBeforeMinutes]);

  useEffect(() => {
    if (!user) {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      return;
    }

    // Initialiser le warning timeout (sans appeler setState directement)
    lastActivityRef.current = Date.now();
    const warningTime = (inactivityMinutes - warningBeforeMinutes) * 60 * 1000;
    
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
    }, warningTime);

    const events = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      resetWarning();
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [user, inactivityMinutes, warningBeforeMinutes, resetWarning]);

  return { showWarning, setShowWarning };
}
