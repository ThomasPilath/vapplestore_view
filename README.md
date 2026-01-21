# Vapplestore View 🚀

**Auteur :** PILATH

## À propos

**Vapplestore View** est un outil d'administration pour le suivi et la gestion des boutiques de la franchise **Vapplestore**. Il fournit une interface claire pour consulter les rapports, gérer les inventaires et suivre l'activité quotidienne.

---

## Fonctionnalités principales ✅

- 🔐 **Authentification sécurisée** avec gestion des rôles
- 📊 Tableau de bord et pages de reporting
- 👥 **Page d'administration des utilisateurs** (admins)
- ⚙️ Gestion des paramètres personnalisables
- 🎨 Thème sombre/clair
- 📱 Interface responsive

---

## Technologies

- **Next.js** 16.1.1 + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **MySQL/MariaDB**
- **Docker** ready

---

## 🚀 Démarrage rapide

### Prérequis

- Bun ou Node.js
- Base de données MySQL/MariaDB

### Installation

```bash
# Cloner et installer
git clone <repo>
cd vapplestore_view
bun install

# Configurer
cp .env.example .env.local
# Éditer .env.local avec vos valeurs

# Initialiser la base de données
bun run init-prod

# Démarrer
bun run dev
```

L'application sera accessible à `http://localhost:3000`.

### 🔑 Première connexion

Connectez-vous avec les identifiants configurés dans `.env.local` (par défaut : admin / AdminPassword123).

**⚠️ Changez immédiatement le mot de passe** depuis la page "Utilisateurs".

---

## 📦 Scripts disponibles

```bash
bun run dev        # Développement
bun run build      # Build production
bun run start      # Démarrer en production
bun run init-prod  # Initialiser DB + admin
```

---

## 👥 Gestion des utilisateurs

### Rôles
- **vendeur** - Lecture seule
- **gestionnaire** - Lecture + écriture
- **admin** - Tous les droits + gestion utilisateurs

### Créer des utilisateurs

Via l'interface web (recommandé) :
1. Se connecter en tant qu'admin
2. Menu → "Utilisateurs"
3. "Nouvel utilisateur"

Ou via CLI :
```bash
bun run create-user <username> <password> <role>
```

---

## 🐳 Docker

### Développement local

```bash
# Avec MariaDB
docker compose -f docker-compose.dev.yml up -d
```

### Production

```bash
# Build
docker compose build

# Démarrer
docker compose up -d
```

---

## 🔒 Sécurité

### Configuration minimale

Avant le déploiement en production :

1. **Générer des secrets JWT forts** :
   ```bash
   openssl rand -base64 64
   ```

2. **Configurer dans .env.local** :
   ```env
   JWT_ACCESS_SECRET=<votre_secret_généré>
   JWT_REFRESH_SECRET=<votre_secret_généré>
   ADMIN_PASSWORD=<mot_de_passe_fort>
   ```

3. **Utiliser HTTPS** en production

4. **Limiter l'accès à la DB** (firewall)

5. **Configurer des sauvegardes automatiques**

---

## 📁 Structure du projet

```
vapplestore_view/
├── app/           # Pages Next.js
│   ├── api/      # API Routes
│   └── ...       # Pages de l'application
├── components/    # Composants React
├── lib/          # Utilitaires
├── scripts/      # Scripts CLI
└── types/        # Types TypeScript
```

---

## 🐛 Dépannage

### Base de données non initialisée
```bash
bun run init-prod
```

### Erreur de connexion DB
Vérifiez les variables dans `.env.local` :
```bash
bun run test-db
```

### Reset mot de passe admin
```bash
# Se connecter à MySQL
docker compose exec mariadb mariadb -u root -p vapplestore

# Supprimer et recréer
DELETE FROM users WHERE username = 'admin';
exit

bun run init-prod
```

---

## 🤝 Contribution

Projet créé par **PILATH**. 

Pour toute question, ouvrez une issue.

---

## 📝 Licence

Tous droits réservés © 2026

**Suivi** : Consulte l'onglet **Actions** sur GitHub pour voir les logs de build en temps réel.
