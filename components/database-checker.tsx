/**
 * DEPRECATED - Ce composant n'est plus utilisé
 * 
 * L'initialisation de la base de données se fait maintenant au démarrage du serveur
 * via app/init.ts qui est importé dans app/layout.tsx
 * 
 * Cette approche garantit que la DB est initialisée AVANT que le serveur serve
 * des requêtes utilisateur, au lieu d'attendre que le client charge la page.
 */

// Composant vide - à supprimer si vous nettoyez le code
export function DatabaseChecker() {
  return null;
}
