# Guide d'intégration Backend Next.js API Routes

## Architecture implémentée

### Structure

```
app/api/
├── revenues/route.ts        # GET/POST/DELETE
├── purchases/route.ts       # GET/POST/DELETE
lib/
├── db.ts                    # Pool MySQL2 (connexion)
├── validators.ts            # Schémas Zod (validation)
├── api-response.ts          # Helpers réponses API
├── api-client.ts            # Client fetch frontend
├── db-init.ts              # Script initialisation DB
hook/
├── revenue.store.ts        # Store Zustand connecté à l'API Revenue
├── purchase.store.ts       # Store Zustand connecté à l'API Purchase
```

## Fonctionnalités

### ✅ Routes API

- **GET /api/revenues** → Récupère tous les revenues (optionnel: ?month=2024-01)
- **POST /api/revenues** → Crée un revenue (validation Zod incluse)
- **DELETE /api/revenues** → Supprime tous les revenues

- **GET /api/purchases** → Récupère tous les purchases (optionnel: ?month=2024-01)
- **POST /api/purchases** → Crée un purchase (validation Zod incluse)
- **DELETE /api/purchases** → Supprime tous les purchases

### ✅ Validation Zod

Chaque entrée est validée avant insertion :
- Types stricts (string, number, date)
- Valeurs positives pour les montants
- Format date ISO (YYYY-MM-DD)
- Erreurs détaillées retournées au frontend

### ✅ Client API

Fonctions helper dans `lib/api-client.ts` :

```typescript
// Revenues
await revenueAPI.getAll()
await revenueAPI.getByMonth("2024-01")
await revenueAPI.create({ date, base20, tva20, ... })
await revenueAPI.deleteAll()

// Purchases
await purchaseAPI.getAll()
await purchaseAPI.getByMonth("2024-01")
await purchaseAPI.create({ date, priceHT, tva, ... })
await purchaseAPI.deleteAll()
```

## Mise en place

### 1. Installation dépendances

```bash
npm install mysql2 zod
# ou avec bun
bun install mysql2 zod
```

### 2. Variables d'environnement

Copier `.env.example` en `.env` et configurer :

```env
DATABASE_HOST=mariadb
DATABASE_PORT=3306
DATABASE_NAME=vapplestore
DATABASE_USER=app_user
DATABASE_PASSWORD=<ton_password>
MARIADB_ROOT_PASSWORD=<ton_password>
NEXT_PUBLIC_API_URL=  # Laisser vide en dev local
```

### 3. Initialiser la DB

Les tables sont créées automatiquement au premier appel API grâce à `lib/db-init.ts`.

Pour initialiser manuellement :

```bash
# Avec docker-compose.dev.yml (MariaDB local)
docker compose -f docker-compose.dev.yml up

# Puis lancer le dev server
npm run dev
```

### 4. Tester en local

```bash
# Terminal 1 : MariaDB + PhpMyAdmin
docker compose -f docker-compose.dev.yml up

# Terminal 2 : Next.js dev server
npm run dev
```

Accès :
- App : http://localhost:3000
- PhpMyAdmin : http://localhost:8080 (user: dev_user / password: dev_password)
- API : http://localhost:3000/api/revenues

## Sécurité

### ✅ Implémentée

- **Validation stricte** : Zod valide tous les inputs
- **Pool de connexions** : Réutilisation efficace des connexions DB
- **Variables d'environnement** : Secrets jamais en dur
- **Erreurs standardisées** : Messages génériques en prod

### 🔄 À ajouter (future)

- Rate limiting (async middleware)
- CORS strict
- Authentication (JWT ou sessions)
- Logging d'audit
- Soft deletes pour l'historique
- Transactions DB pour opérations multiples

## Migration depuis localStorage → DB

### Étape 1 : Remplacer les stores par les hooks

Avant :
```typescript
import { storeRevenue } from "@/hook/revenue.store";

const addEntry = storeRevenue((s) => s.addEntry);
```

Après :
```typescript
import { storeRevenue } from "@/hook/revenue.store";

const { addEntry } = useRevenue();
```

### Étape 2 : Gestion du chargement

Les nouveaux hooks incluent `loading` et `error` :

```typescript
const { entries, loading, error, addEntry } = useRevenue();

if (loading) return <p>Chargement...</p>;
if (error) return <p>Erreur: {error}</p>;

return <div>{entries.map(...)}</div>;
```

## Performance

### Optimisations en place

- Index sur colonne `date` pour les filtres
- Pool de connexions (10 connexions max)
- Requêtes paramétrées (protection SQL injection)
- Cache HTTP possible avec Next.js

### Possible améliorations

- Pagination (LIMIT/OFFSET)
- Caching avec revalidate
- Agrégations DB pour les stats
- Archivage des anciennes données

## Troubleshooting

### "Connection refused"

```bash
# Vérifier que MariaDB est en cours d'exécution
docker compose -f docker-compose.dev.yml logs mariadb

# Vérifier les variables d'environnement dans .env
```

### "Validation error" (400)

Vérifier que les données envoyées respectent le schéma Zod :
- `date` au format YYYY-MM-DD
- Montants comme nombres (number)
- Pas de champs manquants requis

### "Table doesn't exist" (1146)

Les tables sont créées automatiquement à la première requête. Si problème :
- Vérifier la permission de l'utilisateur DB
- Vérifier `DATABASE_NAME` dans `.env`

## Documentation API

Endpoints avec exemples curl :

```bash
# GET revenues
curl http://localhost:3000/api/revenues

# POST revenue
curl -X POST http://localhost:3000/api/revenues \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "base20": 1000,
    "tva20": 200,
    "base5_5": 500,
    "tva5_5": 27.5,
    "ht": 1500,
    "ttc": 1727.5
  }'

# DELETE all revenues (ATTENTION!)
curl -X DELETE http://localhost:3000/api/revenues
```

## Prochaines étapes

1. ✅ Routes API GET/POST/DELETE
2. ⏳ Routes PATCH/PUT pour update individuel
3. ⏳ Pagination et filtres avancés
4. ⏳ Export PDF/Excel
5. ⏳ Webhooks pour synchronisation temps réel
6. ⏳ Tests API (Jest + Supertest)
