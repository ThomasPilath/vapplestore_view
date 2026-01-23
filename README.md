# Vapplestore View 🚀

**Auteur :** PILATH  
**Version :** 2.0.0  
**Status :** ✅ Production Ready (après configuration sécurité)

## À propos

**Vapplestore View** est un outil d'administration pour le suivi et la gestion des boutiques de la franchise **Vapplestore**. Il fournit une interface claire pour consulter les rapports, gérer les inventaires et suivre l'activité quotidienne.

---

## Fonctionnalités principales ✅

- 🔐 **Authentification sécurisée** avec httpOnly cookies et JWT
- 🛡️ **Rate limiting** anti brute-force (5 tentatives/15 min)
- 📊 Tableau de bord et pages de reporting
- 👥 **Page d'administration des utilisateurs** (admins)
- 📝 **Audit trail** complet (qui/quand/quoi)
- 🗃️ **Soft delete** - données préservées
- ⚙️ Gestion des paramètres personnalisables
- 🎨 Thème sombre/clair
- 📱 Interface responsive
- 🐳 Docker ready avec non-root user
- 🔒 Headers de sécurité (CSP, X-Frame-Options, etc.)

---

## Technologies

- **Next.js** 16.1.1 + **TypeScript** 5.9.3 (strict mode)
- **React** 19.2.3 avec **Zustand** state management
- **Tailwind CSS** 4.1.18 + **shadcn/ui**
- **MySQL/MariaDB** 11 avec connexion pooling
- **JWT** (jsonwebtoken 9.0.3) - Access 15min + Refresh 7d
- **bcryptjs** 3.0.3 - Hashing sécurisé
- **Zod** 3.23.8 - Validation schémas
- **Docker** multi-stage build optimisé

---

## 🚀 Démarrage rapide

### Prérequis

- **Bun** ou Node.js 20+
- Base de données **MySQL/MariaDB** 11+
- **Docker** (optionnel)

### Installation

```bash
# Cloner et installer
git clone <repo>
cd vapplestore_view
bun install

# Configurer les variables d'environnement
cp .env.example .env.local
# IMPORTANT : Éditer .env.local avec vos valeurs (voir section Variables d'environnement)
```

### Initialisation de la base de données

**Option 1 : Migration automatique (recommandé)**
```bash
# Démarrer l'application - les migrations s'appliquent automatiquement
bun run dev

# Ou via l'API
curl http://localhost:3000/api/db-check
```

**Option 2 : Script d'initialisation**
```bash
# Créer tables + utilisateur admin
bun run init-prod
```

### Démarrage

```bash
# Développement
bun run dev

# Production
bun run build
bun run start
```

L'application sera accessible à `http://localhost:3000`.

---

## 📡 Routes API importantes

### 🔧 Administration & Système

| Route | Méthode | Description | Auth |
|-------|---------|-------------|------|
| `/api/db-check` | GET | Vérifier DB + appliquer migrations | Non |
| `/api/init` | POST | Initialiser DB + créer admin | Non |
| `/api/audit` | GET | Historique audit (params: `recordId`, `tableName`, `userId`) | Admin |

### 🔐 Authentification

| Route | Méthode | Description | Auth |
|-------|---------|-------------|------|
| `/api/auth/login` | POST | Connexion (body: `username`, `password`) | Non |
| `/api/auth/logout` | POST | Déconnexion | Oui |
| `/api/auth/refresh` | POST | Rafraîchir token | Non (cookie) |
| `/api/auth/me` | GET | Utilisateur actuel | Oui |

### 📊 Données métier

| Route | Méthode | Description | Auth | Role min |
|-------|---------|-------------|------|----------|
| `/api/purchases` | GET | Liste achats | Oui | vendeur |
| `/api/purchases` | POST | Créer achat | Oui | gestionnaire |
| `/api/purchases` | PUT | Modifier achat | Oui | gestionnaire |
| `/api/purchases` | DELETE | Supprimer achat (soft) | Oui | gestionnaire |
| `/api/revenues` | GET | Liste revenus | Oui | vendeur |
| `/api/revenues` | POST | Créer revenu | Oui | gestionnaire |
| `/api/revenues` | PUT | Modifier revenu | Oui | gestionnaire |
| `/api/revenues` | DELETE | Supprimer revenu (soft) | Oui | gestionnaire |

### 👥 Gestion utilisateurs

| Route | Méthode | Description | Auth | Role min |
|-------|---------|-------------|------|----------|
| `/api/admin/users` | GET | Liste utilisateurs | Oui | admin |
| `/api/admin/users` | POST | Créer utilisateur | Oui | admin |
| `/api/admin/users` | PUT | Modifier utilisateur | Oui | admin |
| `/api/admin/users` | DELETE | Supprimer utilisateur (soft) | Oui | admin |
| `/api/admin/roles` | GET | Liste rôles disponibles | Oui | admin |

### 📋 Exemples d'utilisation

**Vérifier et migrer la base de données :**
```bash
curl http://localhost:3000/api/db-check
# ✅ Réponse : { connected: true, migrationsApplied: 3 }
```

**Consulter l'audit trail :**
```bash
# Historique d'un utilisateur
curl -H "Cookie: accessToken=..." \
  "http://localhost:3000/api/audit?userId=1"

# Historique d'un enregistrement
curl -H "Cookie: accessToken=..." \
  "http://localhost:3000/api/audit?recordId=5&tableName=purchases"
```

**Login :**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YourPassword"}' \
  -c cookies.txt
# Les tokens sont dans les cookies httpOnly
```

---

## 🔑 Variables d'environnement

### 📝 Fichier `.env.local` ou `.env`

```env
# Base de données (OBLIGATOIRE)
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=your_mysql_password
DATABASE_NAME=vapplestore

# JWT Secrets (OBLIGATOIRE - générer avec openssl rand -base64 64)
JWT_ACCESS_SECRET=your_very_long_random_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_very_long_random_refresh_secret_min_32_chars

# Utilisateur admin initial (optionnel - défauts : admin/AdminPassword123)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourStrongPassword123!

# CORS - Origines autorisées (optionnel)
# Format: comma-separated list
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:6413,https://votre-domaine.com

# API Key (optionnel - pour intégrations futures)
API_KEY=your_api_key_if_needed
```

### ⚠️ IMPORTANT - Sécurité

**Avant production, vous DEVEZ :**

1. **Générer des secrets JWT forts** :
   ```bash
   # Générer un secret access
   openssl rand -base64 64
   
   # Générer un secret refresh (différent!)
   openssl rand -base64 64
   ```

2. **Copier les secrets dans `.env.local`** :
   ```env
   JWT_ACCESS_SECRET=<output_commande_1>
   JWT_REFRESH_SECRET=<output_commande_2>
   ```

3. **Changer le mot de passe admin par défaut** :
   ```env
   ADMIN_PASSWORD=VotreMotDePasseTrèsComplexe123!@#
   ```

4. **Configurer ALLOWED_ORIGINS pour votre domaine** :
   ```env
   ALLOWED_ORIGINS=https://votre-domaine.com,https://www.votre-domaine.com
   ```

---

## 🔒 Sécurité - Features implémentées

### ✅ Authentification & Autorisation
- ✅ **httpOnly Cookies** - Tokens inaccessibles au JavaScript (protection XSS)
- ✅ **JWT Rotation** - Refresh token rotation automatique
- ✅ **Rate Limiting** - 5 tentatives login / 15 min par IP
- ✅ **Secrets validation** - Application refuse de démarrer sans JWT_*_SECRET
- ✅ **Role-based access** - 3 niveaux (vendeur/gestionnaire/admin)
- ✅ **Password hashing** - bcrypt avec salt rounds 10

### ✅ Base de données
- ✅ **Migrations versionnées** - Schema changes trackés (v1, v2, v3)
- ✅ **Transactions** - Opérations multi-tables atomiques
- ✅ **Audit trail** - Table `audit_log` track tous les changements
- ✅ **Soft delete** - Données préservées avec `deletedAt`
- ✅ **Parameterized queries** - Protection SQL injection
- ✅ **Unique index** - `users.username` pour performance login

### ✅ Headers de sécurité
- ✅ **CORS explicite** - Middleware avec origines whitelistées
- ✅ **Content-Security-Policy** - Limite sources de contenu
- ✅ **X-Frame-Options** - Protection clickjacking
- ✅ **X-Content-Type-Options** - nosniff
- ✅ **Strict-Transport-Security** - Force HTTPS
- ✅ **Referrer-Policy** - Limite fuites d'info
- ✅ **Permissions-Policy** - Désactive APIs sensibles

### ✅ Infrastructure
- ✅ **Docker non-root user** - Container s'exécute avec UID 1001
- ✅ **Multi-stage build** - Image optimisée Alpine Linux
- ✅ **GitHub Actions** - Lint + Type check avant build
- ✅ **Structured logging** - Logs avec contexte (ready for Sentry/DataDog)

---

## 📦 Scripts disponibles

```bash
# Développement
bun run dev              # Démarrer serveur dev (port 3000)
bun run build            # Build production
bun run start            # Démarrer en production
bun run lint             # Linter ESLint

# Base de données
bun run init-prod        # Initialiser DB + créer admin
bun run test-db          # Tester connexion DB
bun run migrate-add-settings  # Migration paramètres (legacy)

# Utilisateurs
bun run create-user      # CLI création utilisateur
# Usage: bun run create-user <username> <password> <role>
# Exemple: bun run create-user john Secret123 gestionnaire

# Tests & Développement
bun run test-api         # Tester endpoints API
```

---

## 👥 Gestion des utilisateurs

### Rôles disponibles

| Rôle | Level | Permissions |
|------|-------|-------------|
| **vendeur** | 0 | 📖 Lecture seule (purchases, revenues) |
| **gestionnaire** | 1 | 📖 Lecture + ✏️ Écriture (créer/modifier/supprimer) |
| **admin** | 2 | 🔑 Tous droits + gestion utilisateurs + audit |

### Créer des utilisateurs

**Via l'interface web (recommandé) :**
1. Se connecter en tant qu'admin
2. Menu latéral → "Utilisateurs"
3. Bouton "Nouvel utilisateur"
4. Remplir formulaire (username, password, role)

**Via CLI :**
```bash
bun run create-user <username> <password> <role>

# Exemples
bun run create-user alice Password123 vendeur
bun run create-user bob SecurePass456 gestionnaire
bun run create-user charlie AdminPass789 admin
```

### Modifier/Supprimer utilisateurs

- **Interface web** : Page "Utilisateurs" → Actions sur chaque ligne
- **Soft delete** : Les utilisateurs supprimés sont marqués `deletedAt` (données préservées)
- **Audit** : Toutes les modifications sont loggées dans `audit_log`

---

## 🗄️ Architecture base de données

### Tables principales

```sql
users              -- Utilisateurs (soft delete)
├─ id (PK)
├─ username (UNIQUE INDEX)
├─ password (bcrypt hash)
├─ roleLevel (0=vendeur, 1=gestionnaire, 2=admin)
├─ createdBy, updatedBy
└─ deletedAt (soft delete)

purchases          -- Achats magasin (soft delete)
├─ id (PK)
├─ date, amount, notes
├─ createdBy, updatedBy
└─ deletedAt

revenues           -- Revenus (soft delete)
├─ id (PK)  
├─ date, amount, notes
├─ createdBy, updatedBy
└─ deletedAt

settings           -- Paramètres app
├─ id (PK)
├─ userId (FK users)
└─ preferences (JSON)

roles              -- Définition rôles
├─ id (PK)
├─ name, level
└─ description

audit_log          -- Audit trail
├─ id (PK)
├─ userId (FK users)
├─ action (CREATE/UPDATE/DELETE)
├─ tableName, recordId
├─ changes (JSON before/after)
├─ ip, userAgent
└─ createdAt

schema_migrations  -- Tracking migrations
├─ version (PK)
├─ name
└─ applied_at
```

### Migrations système

Le système de migration versionné applique automatiquement les changements :

| Version | Nom | Description |
|---------|-----|-------------|
| v1 | `initial_tables` | Création tables de base + colonnes soft delete |
| v2 | `audit_trail` | Ajout table `audit_log` pour tracking |
| v3 | `unique_username_index` | Index UNIQUE sur `users.username` |

**Appliquer les migrations :**
```bash
# Automatique au démarrage de l'app
bun run dev

# Ou manuellement via API
curl http://localhost:3000/api/db-check
```

---

## 🐳 Docker

### Développement local avec MariaDB

```bash
# Lancer conteneurs (app + mariadb + phpmyadmin)
docker compose -f docker-compose.dev.yml up -d

# Accès
# - App: http://localhost:6413
# - phpMyAdmin: http://localhost:6480

# Logs
docker compose -f docker-compose.dev.yml logs -f app

# Arrêter
docker compose -f docker-compose.dev.yml down
```

### Production

```bash
# Build l'image
docker compose build

# Démarrer (app + mariadb)
docker compose up -d

# Vérifier status
docker compose ps

# Logs
docker compose logs -f app

# Initialiser DB (première fois)
docker compose exec app bun run init-prod

# Arrêter
docker compose down
```

### Configuration Docker

**Ports exposés :**
- **App** : `6413:3000`
- **MariaDB** : `3307:3306` (interne uniquement en prod)
- **phpMyAdmin** : `6480:80` (dev only)

**Volumes persistants :**
- `mariadb_data` : Données MySQL/MariaDB

**Sécurité Docker :**
- ✅ Multi-stage build (image finale : ~200MB Alpine)
- ✅ Non-root user (UID 1001, GID 1001)
- ✅ Healthchecks configurés
- ✅ Optimisations cache layers

---

## 🚀 Déploiement production

### Checklist pré-déploiement

```bash
☐ Variables d'environnement configurées (JWT secrets, DB credentials)
☐ ALLOWED_ORIGINS configuré avec votre domaine
☐ HTTPS activé (reverse proxy Nginx/Cloudflare)
☐ Firewall DB configuré (accès localhost only)
☐ phpmyadmin retiré du docker-compose.yml (ou .override.yml dev only)
☐ Tests manuels effectués (login, CRUD, audit)
☐ Backup strategy définie
☐ Monitoring configuré (optionnel: Sentry/DataDog)
```

### Variables d'environnement production

**Créer `.env` sur serveur :**
```env
# Database
DATABASE_HOST=mariadb
DATABASE_PORT=3306
DATABASE_USER=vapplestore_user
DATABASE_PASSWORD=<généré_fort>
DATABASE_NAME=vapplestore

# JWT (GÉNÉRER avec openssl rand -base64 64)
JWT_ACCESS_SECRET=<secret_64_chars_min>
JWT_REFRESH_SECRET=<secret_64_chars_different>

# Admin initial
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<mot_de_passe_très_fort>

# CORS
ALLOWED_ORIGINS=https://votre-domaine.com,https://www.votre-domaine.com
```

### Déploiement via Docker

```bash
# Sur le serveur
git clone <repo>
cd vapplestore_view

# Copier variables d'environnement
cp .env.example .env
nano .env  # Éditer avec valeurs production

# Build et démarrer
docker compose up -d --build

# Initialiser base de données
docker compose exec app bun run init-prod

# Vérifier status
docker compose ps
docker compose logs -f

# Tester
curl http://localhost:6413/api/db-check
```

### Reverse Proxy (Nginx/Caddy)

**Exemple Nginx :**
```nginx
server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:6413;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Cloudflare Tunnel (alternative)

```bash
# Installer cloudflared
brew install cloudflare/tap/cloudflared  # macOS
# ou apt install cloudflared              # Linux

# Authentifier
cloudflared tunnel login

# Créer tunnel
cloudflared tunnel create vapplestore

# Configurer
cloudflared tunnel route dns vapplestore votre-domaine.com

# Démarrer tunnel
cloudflared tunnel run vapplestore
```

---

## 🔒 Sécurité avancée

### Hardening base de données

**1. Créer utilisateur DB dédié (non-root) :**
```sql
CREATE USER 'vapplestore_user'@'%' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON vapplestore.* TO 'vapplestore_user'@'%';
FLUSH PRIVILEGES;
```

**2. Limiter accès réseau :**
```yaml
# docker-compose.yml
services:
  mariadb:
    ports:
      - "127.0.0.1:3307:3306"  # Bind localhost uniquement
```

**3. Sauvegardes automatiques :**
```bash
# Cron job (tous les jours à 2h)
0 2 * * * docker compose exec -T mariadb mariadb-dump -u root -p$DB_PASSWORD vapplestore | gzip > /backups/vapplestore_$(date +\%Y\%m\%d).sql.gz
```

### Monitoring & Logs

**Intégration Sentry (erreurs) :**
```bash
# Installer
bun add @sentry/nextjs

# Configurer lib/logger.ts (ready)
# Ajouter DSN dans .env
SENTRY_DSN=https://...@sentry.io/...
```

**Logs application :**
```bash
# Consulter logs Docker
docker compose logs -f app

# Filtrer erreurs
docker compose logs app | grep ERROR

# Exporter logs
docker compose logs app > app_logs_$(date +%Y%m%d).log
```

---

## 📁 Structure du projet

```
vapplestore_view/
├── app/                      # Next.js App Router
│   ├── api/                 # API Routes
│   │   ├── auth/           # Authentification (login, logout, refresh, me)
│   │   ├── admin/          # Gestion utilisateurs & rôles
│   │   ├── purchases/      # CRUD achats
│   │   ├── revenues/       # CRUD revenus
│   │   ├── user/           # Paramètres utilisateur
│   │   ├── audit/          # Historique audit trail
│   │   ├── db-check/       # Vérification DB + migrations
│   │   └── init/           # Initialisation DB
│   ├── overview/           # Page dashboard
│   ├── reports/            # Page rapports
│   ├── settings/           # Page paramètres
│   ├── admin/              # Pages admin
│   │   └── users/          # Gestion utilisateurs
│   ├── layout.tsx          # Layout racine
│   ├── page.tsx            # Page accueil (redirect)
│   └── globals.css         # Styles globaux
├── components/              # Composants React
│   ├── ui/                 # shadcn/ui components
│   ├── charts/             # Graphiques (Bar, Line, Pie)
│   ├── auth-provider.tsx   # Context authentification
│   ├── login-modal.tsx     # Modal de connexion
│   ├── side-menu.tsx       # Menu latéral navigation
│   ├── purchase-form.tsx   # Formulaire achats
│   └── revenue-form.tsx    # Formulaire revenus
├── lib/                     # Bibliothèques & utilitaires
│   ├── auth.ts             # JWT generation/verification
│   ├── auth-middleware.ts  # Middleware auth routes API
│   ├── db.ts               # Pool connexions MySQL
│   ├── db-init.ts          # Initialisation DB (legacy)
│   ├── db-migrations.ts    # Système migrations (nouveau)
│   ├── migrations.ts       # Migration engine
│   ├── migration-definitions.ts # Définitions migrations v1-v3
│   ├── transaction.ts      # Transaction wrapper
│   ├── audit.ts            # Audit trail service
│   ├── rate-limit.ts       # Rate limiting anti brute-force
│   ├── logger.ts           # Structured logging
│   ├── calculations.ts     # Calculs métier
│   ├── validators.ts       # Schémas Zod validation
│   ├── api-client.ts       # Client API fetch helper
│   ├── api-response.ts     # Helpers réponses API
│   └── utils.ts            # Utilitaires divers
├── hook/                    # Zustand stores
│   ├── auth.store.ts       # State authentification
│   ├── purchase.store.ts   # State achats
│   ├── revenue.store.ts    # State revenus
│   └── settings.store.ts   # State paramètres
├── types/                   # Types TypeScript
│   └── index.ts            # Types globaux
├── scripts/                 # Scripts CLI
│   ├── create-user.ts      # Créer utilisateur
│   ├── init-prod.ts        # Init DB production
│   ├── test-db.ts          # Tester connexion DB
│   └── test-api.ts         # Tester endpoints API
├── public/                  # Assets statiques
├── middleware.ts            # Middleware Next.js (CORS, headers)
├── next.config.ts           # Config Next.js (CSP, headers)
├── tsconfig.json            # Config TypeScript (strict)
├── eslint.config.mjs        # Config ESLint
├── tailwind.config.ts       # Config Tailwind CSS
├── components.json          # Config shadcn/ui
├── Dockerfile               # Image Docker (non-root user)
├── docker-compose.yml       # Production
├── docker-compose.dev.yml   # Développement
├── package.json             # Dependencies & scripts
├── .env.example             # Template variables d'environnement
└── README.md                # Ce fichier
```

---

## 🐛 Dépannage

### Problème : Base de données non initialisée

**Symptômes :**
- Erreur "Table 'users' doesn't exist"
- Login impossible

**Solution :**
```bash
# Option 1: Script init (recommandé première fois)
bun run init-prod

# Option 2: API endpoint
curl http://localhost:3000/api/init -X POST

# Option 3: Migrations auto (au démarrage)
bun run dev
# Les migrations s'appliquent automatiquement
```

### Problème : Erreur de connexion DB

**Symptômes :**
- "ECONNREFUSED" ou "Access denied"

**Diagnostic :**
```bash
# Tester connexion
bun run test-db

# Vérifier variables d'environnement
cat .env.local | grep DATABASE

# Vérifier que MariaDB tourne
docker compose ps mariadb
```

**Solutions :**
1. Vérifier `DATABASE_HOST`, `DATABASE_USER`, `DATABASE_PASSWORD` dans `.env.local`
2. Si Docker : vérifier que le conteneur `mariadb` est démarré
3. Tester connexion manuelle :
   ```bash
   mysql -h localhost -P 3307 -u root -p vapplestore
   ```

### Problème : JWT secrets non définis

**Symptômes :**
- Erreur "JWT_ACCESS_SECRET must be defined"
- Application refuse de démarrer

**Solution :**
```bash
# Générer secrets
openssl rand -base64 64  # Secret 1
openssl rand -base64 64  # Secret 2

# Ajouter dans .env.local
echo "JWT_ACCESS_SECRET=<secret1>" >> .env.local
echo "JWT_REFRESH_SECRET=<secret2>" >> .env.local

# Redémarrer
bun run dev
```

### Problème : Rate limiting bloque login

**Symptômes :**
- 429 Too Many Requests après 5 tentatives

**Solution :**
```bash
# Attendre 15 minutes
# OU redémarrer serveur (efface cache mémoire)
# OU changer d'IP/navigateur
```

### Problème : Migrations non appliquées

**Symptômes :**
- Colonnes manquantes (`deletedAt`, `createdBy`)
- Table `audit_log` n'existe pas

**Solution :**
```bash
# Vérifier migrations via API
curl http://localhost:3000/api/db-check

# Relancer manuellement
bun run dev
# Consulter logs : "✅ Migration X appliquée avec succès"
```

### Problème : Reset mot de passe admin

**Si vous avez oublié le mot de passe admin :**

```bash
# Option 1: Via MySQL
docker compose exec mariadb mariadb -u root -p

# Dans MySQL :
USE vapplestore;
DELETE FROM users WHERE username = 'admin';
exit

# Recréer admin
bun run init-prod

# Option 2: Créer nouvel admin
bun run create-user newadmin StrongPass123 admin
```

### Problème : CORS errors

**Symptômes :**
- "Access-Control-Allow-Origin" error dans console

**Solution :**
```env
# Ajouter votre origine dans .env.local
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:6413,https://votre-domaine.com

# Redémarrer
bun run dev
```

### Problème : Docker build fail

**Symptômes :**
- "permission denied" ou "user nextjs not found"

**Solution :**
```bash
# Rebuild from scratch
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

---

## 🧪 Tests & Validation

### Tests manuels rapides

```bash
# 1. Tester connexion DB
bun run test-db
# ✅ Devrait afficher : "✅ Connexion réussie"

# 2. Tester API
bun run test-api
# ✅ Devrait tester login, refresh, CRUD

# 3. Vérifier migrations
curl http://localhost:3000/api/db-check
# ✅ { "connected": true, "migrationsApplied": 3 }

# 4. Tester rate limiting
# Faire 6 tentatives login incorrectes
# ✅ 6ème devrait retourner 429

# 5. Tester audit trail
# Créer/modifier/supprimer une entrée
# Vérifier dans audit_log
```

### Tests d'intégration (à venir)

```bash
# TODO: Ajouter tests avec Vitest
bun test
```

---

## 📚 Ressources & Documentation

### Documentation officielle

- [Next.js 16 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Zod Validation](https://zod.dev/)

### Standards de sécurité

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

### Outils recommandés

- **DB Client** : [DBeaver](https://dbeaver.io/) ou [TablePlus](https://tableplus.com/)
- **API Testing** : [Bruno](https://www.usebruno.com/) ou [Postman](https://www.postman.com/)
- **Monitoring** : [Sentry](https://sentry.io/) ou [DataDog](https://www.datadoghq.com/)
- **Logs** : [Better Stack](https://betterstack.com/) ou [Logtail](https://logtail.com/)

---

## 🤝 Contribution

### Guidelines

1. **Fork** le repo
2. Créer une **branche feature** : `git checkout -b feature/ma-feature`
3. **Commiter** : `git commit -m "feat: ajouter X"`
4. **Push** : `git push origin feature/ma-feature`
5. Ouvrir une **Pull Request**

### Conventions

- **Commits** : [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat:` nouvelle fonctionnalité
  - `fix:` correction bug
  - `docs:` documentation
  - `style:` formatting
  - `refactor:` refactoring code
  - `test:` ajout tests
  - `chore:` maintenance

- **Code Style** : ESLint + Prettier
- **TypeScript** : Mode strict activé
- **Naming** : camelCase (JS/TS), kebab-case (fichiers)

---

## 📋 Changelog

### Version 2.0.0 (2026-01-23)

**🔒 Sécurité (CRITIQUE)**
- ✅ httpOnly cookies pour tokens JWT (protection XSS)
- ✅ Rate limiting login (5 tentatives/15min)
- ✅ JWT secrets validation au démarrage
- ✅ CORS explicite avec whitelist origines
- ✅ Headers de sécurité (CSP, X-Frame-Options, HSTS, etc.)
- ✅ Docker non-root user (UID/GID 1001)
- ✅ Unique index sur `users.username`

**🗄️ Base de données**
- ✅ Système de migrations versionné (v1-v3)
- ✅ Transaction wrapper pour opérations atomiques
- ✅ Audit trail complet (`audit_log` table)
- ✅ Soft delete pattern (colonne `deletedAt`)
- ✅ Tracking utilisateur (colonnes `createdBy`, `updatedBy`)

**🛠️ Infrastructure**
- ✅ Middleware Next.js pour CORS et headers
- ✅ GitHub Actions avec lint + type check
- ✅ Structured logging avec contexte
- ✅ API `/api/audit` pour historique
- ✅ API `/api/db-check` pour migrations

**📝 Documentation**
- ✅ README complet avec routes API
- ✅ Guide troubleshooting
- ✅ Documentation variables d'environnement
- ✅ Checklist déploiement production

### Version 1.0.0 (2026-01-15)

- 🎉 Release initiale
- ✅ Authentification JWT basique
- ✅ CRUD purchases & revenues
- ✅ Gestion utilisateurs (admins)
- ✅ Dashboard & reporting
- ✅ Docker support

---

## 📞 Support

### Questions fréquentes (FAQ)

**Q: L'application est-elle prête pour la production ?**  
R: Oui, après avoir suivi la checklist de sécurité (JWT secrets, HTTPS, etc.)

**Q: Comment migrer depuis la v1.0 ?**  
R: Les migrations s'appliquent automatiquement au démarrage. Les données existantes sont préservées.

**Q: Puis-je utiliser PostgreSQL au lieu de MySQL ?**  
R: Non actuellement. Le code utilise mysql2. Une migration nécessiterait adapter lib/db.ts.

**Q: Les données supprimées sont-elles récupérables ?**  
R: Oui, grâce au soft delete. Les données ont un champ `deletedAt` mais restent en base.

**Q: Comment activer le mode debug ?**  
R: Ajouter `DEBUG=true` dans `.env.local` et consulter les logs.

### Contact

**Auteur :** PILATH  
**Projet :** Vapplestore View  
**Année :** 2026

Pour signaler un bug ou proposer une amélioration, ouvrez une **issue** sur GitHub.

---

## 📝 Licence

**Tous droits réservés © 2026 PILATH**

Ce projet est privé et propriétaire. Toute reproduction, distribution ou utilisation non autorisée est interdite.

---

## ⭐ Remerciements

- **Next.js Team** pour le framework
- **Vercel** pour shadcn/ui
- **shadcn** pour les composants UI
- **Communauté open-source** pour les bibliothèques utilisées

---

**✅ Vapplestore View - Production Ready depuis v2.0.0**

*Pour toute question, consultez la section Dépannage ou ouvrez une issue GitHub.*
