# Déploiement avec Portainer

## 📦 Architecture

- **GitHub Actions** : Build et push l'image de l'app sur Docker Hub
- **Portainer Stack** : Orchestre 3 conteneurs (App + MariaDB + phpMyAdmin)

## 🚀 Déploiement dans Portainer

### 1. Créer une nouvelle Stack

Dans Portainer :
1. Aller dans **Stacks** → **Add stack**
2. Nom : `vapplestore-view`
3. Build method : **Web editor**

### 2. Copier le contenu de `docker-compose.yml`

Coller le contenu complet du fichier dans l'éditeur.

### 3. Définir les variables d'environnement

Dans la section **Environment variables**, ajouter :

```
DOCKERHUB_USERNAME=ton_username_dockerhub
DATABASE_NAME=vapplestore
DATABASE_USER=vapplestore_user
DATABASE_PASSWORD=ton_mot_de_passe_securise
MARIADB_ROOT_PASSWORD=ton_root_password_securise
APP_EXPOSITION_PORT=6413
PHPMYADMIN_PORT=8080
PHPMYADMIN_URL=https://db.tondomaine.com
```

**⚠️ Important** : Utilise des mots de passe forts et uniques !

### 4. Déployer la stack

Cliquer sur **Deploy the stack**

### 5. Vérifier le déploiement

1. Vérifier que les 3 conteneurs sont en statut **running** :
   - `vapplestore-view_app`
   - `vapplestore-view_mariadb`
   - `vapplestore-view_phpmyadmin`

2. Vérifier les logs du conteneur `app` :
   - Il devrait afficher : `✅ Database pool created successfully`
   - Puis : `✅ Database structure verified and updated`

3. Accéder à l'application :
   - http://ton-serveur:6413

4. Accéder à phpMyAdmin :
   - http://ton-serveur:8080
   - Identifiant : `vapplestore_user` (ou celui défini)
   - Mot de passe : Celui défini dans `DATABASE_PASSWORD`

## 🌐 Configuration du sous-domaine pour phpMyAdmin

### Option 1 : Reverse Proxy avec Nginx Proxy Manager (recommandé)

Si tu utilises Nginx Proxy Manager dans Portainer :

1. Ajouter un **Proxy Host** :
   - **Domain Names** : `db.tondomaine.com`
   - **Scheme** : `http`
   - **Forward Hostname / IP** : `vapplestore-view_phpmyadmin` (nom du conteneur)
   - **Forward Port** : `80`
   - **Cache Assets** : ✅
   - **Block Common Exploits** : ✅
   - **Websockets Support** : ❌

2. Onglet **SSL** :
   - Activer **Force SSL**
   - Activer **HTTP/2 Support**
   - Sélectionner **Request a new SSL Certificate** (Let's Encrypt)

3. Sauvegarder

### Option 2 : Reverse Proxy avec Traefik

Si tu utilises Traefik, ajoute ces labels au service `phpmyadmin` :

```yaml
phpmyadmin:
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.phpmyadmin.rule=Host(`db.tondomaine.com`)"
    - "traefik.http.routers.phpmyadmin.entrypoints=websecure"
    - "traefik.http.routers.phpmyadmin.tls.certresolver=letsencrypt"
    - "traefik.http.services.phpmyadmin.loadbalancer.server.port=80"
```

### Option 3 : Sans reverse proxy (accès direct par IP:port)

Accès direct via : `http://IP-SERVEUR:8080`

**⚠️ Attention** : Moins sécurisé, expose le port publiquement

## 🔄 Mise à jour de l'application

### Automatique via GitHub Actions

1. Pousser du code sur la branche `main`
2. GitHub Actions build et push automatiquement la nouvelle image
3. Dans Portainer, aller dans la stack `vapplestore-view`
4. Cliquer sur **Update the stack**
5. Activer **Re-pull image and redeploy**
6. Cliquer sur **Update**

### Manuelle

Dans Portainer :
1. Aller dans **Containers**
2. Sélectionner `vapplestore-view_app`
3. Cliquer sur **Recreate**
4. Activer **Pull latest image version**
5. Cliquer sur **Recreate**

## 🔧 Accès à la base de données

### Via phpMyAdmin (recommandé)

1. Accéder à `http://ton-serveur:8080` (ou `https://db.tondomaine.com` si configuré)
2. Connexion :
   - **Serveur** : `mariadb`
   - **Utilisateur** : `vapplestore_user` (ou celui défini)
   - **Mot de passe** : Celui défini dans `DATABASE_PASSWORD`

### Depuis le serveur (via SSH)

```bash
# Se connecter au conteneur MariaDB
docker exec -it vapplestore-view_mariadb mysql -u root -p

# Vérifier les tables
USE vapplestore;
SHOW TABLES;
DESCRIBE revenues;
DESCRIBE purchases;
```

### Depuis un client externe (ex: DBeaver, MySQL Workbench)

**⚠️ Non recommandé en production** - Le port MariaDB n'est plus exposé pour des raisons de sécurité.

Si nécessaire, expose temporairement le port en ajoutant dans `docker-compose.yml` :
```yaml
mariadb:
  ports:
    - "6464:3306"  # À utiliser uniquement pour debug
```

## 📊 Monitoring

### Vérifier les logs en temps réel

```bash
# Logs de l'app
docker logs -f vapplestore-view_app

# Logs de la DB
docker logs -f vapplestore-view_mariadb
```

### Vérifier l'état de santé

```bash
# État des conteneurs
docker ps | grep vapplestore-view

# Health check de MariaDB
docker inspect vapplestore-view_mariadb | grep -A 10 Health
```

## 🛠️ Dépannage

### L'app ne se connecte pas à la DB

1. Vérifier que `DATABASE_HOST=mariadb` (pas `localhost`)
2. Vérifier les variables d'environnement dans Portainer
3. Vérifier les logs du conteneur `app`

### La DB ne démarre pas

1. Vérifier les logs du conteneur `mariadb`
2. Vérifier que le volume `mariadb_data` existe
3. Si nécessaire, supprimer le volume et recréer la stack

### Réinitialiser complètement

```bash
# Arrêter et supprimer la stack
docker stack rm vapplestore-view

# Supprimer le volume (⚠️ perte de données)
docker volume rm vapplestore-view_mariadb_data

# Recréer la stack dans Portainer
```

## 🔐 Sécurité

### Recommandations

1. **Ne jamais commiter le fichier `.env`** avec des vraies credentials
2. Utiliser des mots de passe forts (>20 caractères)
3. Limiter l'accès au port 6464 (MariaDB) depuis l'extérieur
4. Activer le pare-feu sur le serveur
5. Sauvegarder régulièrement le volume `mariadb_data`

### Sauvegarde de la base de données

```bash
# Backup
docker exec vapplestore-view_mariadb mysqldump -u root -p vapplestore > backup.sql

# Restore
docker exec -i vapplestore-view_mariadb mysql -u root -p vapplestore < backup.sql
```

## 📝 Ports utilisés

| Service     | Port interne | Port exposé | Description |
|-------------|--------------|-------------|-------------|
| App         | 3000         | 6413        | Application Next.js |
| MariaDB     | 3306         | -           | Base de données (non exposé) |
| phpMyAdmin  | 80           | 8080        | Interface web DB |

## 🏗️ Architecture du système

```
┌─────────────────────────────────────────────────┐
│              Portainer Stack                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────┐   ┌──────────┐   ┌────────────┐  │
│  │          │   │          │   │            │  │
│  │   App    │──▶│ MariaDB  │◀──│ phpMyAdmin │  │
│  │(Next.js) │   │          │   │            │  │
│  │          │   │          │   │            │  │
│  └──────────┘   └──────────┘   └────────────┘  │
│      :6413           (privé)        :8080       │
│        │                              │         │
└────────┼──────────────────────────────┼─────────┘
         │                              │
         ▼                              ▼
    Public Web                    DB Management
                               (via sous-domaine)
```

**Sécurité** :
- ✅ MariaDB **non exposé** publiquement
- ✅ Accès DB uniquement via phpMyAdmin
- ✅ phpMyAdmin derrière reverse proxy avec SSL
