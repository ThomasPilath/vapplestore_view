# Vapplestore View 🚀

**Auteur :** PILATH

## À propos

**Vapplestore View** est un outil d'administration pensé pour le suivi et la gestion des boutiques de la franchise **Vapplestore**. Il fournit une interface claire pour consulter les rapports, gérer les inventaires en boutiques et suivre l'activité quotidienne.

---

## Fonctionnalités principales ✅

- Tableau de bord et pages de reporting pour visualiser l'activité
- Gestion des paramètres et préférences des outils
- Thème sombre/clair et bascule d'apparence
- Composants UI réutilisables et état global léger

---

## Technologies & outils 🔧

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** pour le style
- Composants inspirés de **shadcn/ui** (Radix + Tailwind)
- **Zustand** pour la gestion d'état locale
- **Lucide** pour les icônes
- **next-themes** pour la gestion du thème
- Outils de développement : **Bun** (install & dev), **ESLint**, **TypeScript**

---

## Installation & démarrage 🛠️

Prerequis : Bun (recommandé) ou Node (npm / pnpm / yarn)

Avec Bun (recommandé) :

```bash
bun install
bun dev
```

Avec npm :

```bash
npm install
npm run dev
```

L'application sera accessible à l'adresse : `http://localhost:3000`.

Pour construire et démarrer en production :

```bash
npm run build
npm run start
```

Pour lancer le linter :

```bash
npm run lint
```

---

## Structure du projet 📁

- `app/` : pages (App Router)
- `components/` : composants réutilisables (UI, menu, etc.)
- `ui/` : primitives UI (boutons, menus)
- `hook/` : stores et hooks (z. ex. Zustand)
- `lib/` : utilitaires
- `public/` : actifs publics

---

## Contribution & contact ✉️

Projet créé par **PILATH**. Toute contribution est la bienvenue : ouvrez une issue ou une pull request.


Bonne exploration — si vous avez besoin d'aide contactez moi. 💡

---

## Docker & stack MariaDB 🐳

### Configuration initiale (obligatoire)

1. **Créer le fichier `.env`** depuis le template :
   ```bash
   cp .env.example .env
   ```

2. **Renseigner les secrets** dans `.env` :
   - `DOCKERHUB_USERNAME` : ton identifiant Docker Hub
   - `DATABASE_NAME` : nom de la base de données
   - `DATABASE_USER` : nom d'utilisateur pour l'app
   - `DATABASE_PASSWORD` : mot de passe de l'app (à choisir)
   - `MARIADB_ROOT_PASSWORD` : mot de passe root MariaDB (à choisir)

⚠️ **Sécurité** : Le fichier `.env` est ignoré par git. Ne jamais commiter de secrets !

### Construire et lancer en local

```bash
# Build l'image locale
docker compose build

# Démarre l'app + MariaDB (ports 3000 et 3306 exposés)
docker compose up

# Ou en mode détaché
docker compose up -d
```

La stack complète démarre avec :
- **App Next.js** : `http://localhost:3000`
- **MariaDB 11** : `localhost:3306` (accessible avec les credentials du `.env`)
- **Volume persistant** : `mariadb_data` pour conserver les données DB

### Publication automatique sur Docker Hub (CI/CD GitHub Actions)

Le workflow `.github/workflows/docker-publish.yml` build et publie automatiquement l'image sur Docker Hub.

**Configuration des secrets GitHub** (une seule fois) :

1. Va dans **Settings** → **Secrets and variables** → **Actions**
2. Ajoute :
   - `DOCKERHUB_USERNAME` : ton nom d'utilisateur Docker Hub
   - `DOCKERHUB_TOKEN` : un [access token Docker Hub](https://hub.docker.com/settings/security) avec droits de push

**Déclenchement du workflow** :
- ✅ Automatique sur `push` vers `main`
- ✅ Sur les tags `v*` (releases)
- ✅ Manuellement via **Actions** → **Run workflow** (sur n'importe quelle branche)

**Tags d'images générés** :
- `pilath/vapplestore-view:latest` (branche main uniquement)
- `pilath/vapplestore-view:main` (nom de branche)
- `pilath/vapplestore-view:sha-abc1234` (hash de commit)
- `pilath/vapplestore-view:v1.0.0` (si tag git)

**Suivi** : Consulte l'onglet **Actions** sur GitHub pour voir les logs de build en temps réel.
