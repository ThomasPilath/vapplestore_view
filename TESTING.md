# 🧪 Testing Guide

## Vue d'ensemble

Cette section documente la suite de tests de Vapplestore View v1.0.

### Résultats actuels

✅ **42 tests** passent avec succès  
⏱️ **Temps d'exécution** : ~500-700ms  
📊 **Couverture globale** : 92.50% fonctions, 92.68% lignes

### Types de tests implémentés

- ✅ **Tests unitaires** - Auth, validators, API responses, rate limiting
- ⚠️ **Tests d'intégration** - À implémenter (routes API complètes)
- ⚠️ **Tests E2E** - À implémenter (flows utilisateur)

---

## Exécution des tests

### Lancer tous les tests

```bash
bun test
```

### Lancer les tests en watch mode

```bash
bun test --watch
```

### Lancer un fichier de test spécifique

```bash
bun test __tests__/lib/auth.test.ts
```

### Rapport de couverture

```bash
bun test --coverage
```

---

## Tests unitaires implémentés

### 1. Authentication Service (`__tests__/lib/auth.test.ts`)

Tests pour hashing de passwords et JWT tokens.

**6 tests - Couverture : 80% fonctions, 73.58% lignes**

**Tests inclus :**
- ✅ should hash password correctly
- ✅ should compare password correctly
- ✅ should fail on wrong password
- ✅ should generate token pair (accessToken + refreshToken)
- ✅ should verify access token
- ✅ should return null for invalid token

**Exécution :**
```bash
bun test __tests__/lib/auth.test.ts
```

### 2. Validators (`__tests__/lib/validators.test.ts`)

Tests pour schémas Zod de validation.

**14 tests - Couverture : 100% fonctions, 100% lignes** 🎉

**Tests inclus :**

**Password validation :**
- ✅ Accept password valide
- ✅ Reject password trop court
- ✅ Reject sans uppercase
- ✅ Reject sans number
- ✅ Reject sans special char

**Username validation :**
- ✅ Accept username valide
- ✅ Accept username avec numbers
- ✅ Reject username trop court
- ✅ Reject username avec special chars
- ✅ Reject username avec spaces

**Email validation :**
- ✅ Accept email valide
- ✅ Accept email avec subdomain
- ✅ Reject email invalide
- ✅ Reject email sans domain

**Exécution :**
```bash
bun test __tests__/lib/validators.test.ts
```

### 3. Rate Limiting (`__tests__/lib/rate-limit.test.ts`)

Tests pour le système de rate limiting.

**13 tests - Couverture : 100% fonctions, 100% lignes** 🎉

**Tests inclus :**

**rateLimit function (6 tests):**
- ✅ should allow requests within limit
- ✅ should block requests exceeding limit
- ✅ should provide remaining count
- ✅ should distinguish between different keys
- ✅ should calculate correct retry after seconds
- ✅ should reset after window expires

**getClientIp function (5 tests):**
- ✅ should extract IP from x-forwarded-for header
- ✅ should extract IP from x-real-ip header
- ✅ should prefer x-forwarded-for over x-real-ip
- ✅ should return unknown when no IP headers present
- ✅ should handle empty x-forwarded-for

**rateLimitResponse function (2 tests):**
- ✅ should create 429 response with correct headers
- ✅ should include retry-after in seconds

**Exécution :**
```bash
bun test __tests__/lib/rate-limit.test.ts
```

### 4. API Response Helpers (`__tests__/lib/api-response.test.ts`)

Tests pour les helpers de réponse API.

**9 tests - Couverture : 90% fonctions, 97.14% lignes** 🎯

**Tests inclus :**

**Success responses :**
- ✅ should create 200 OK response
- ✅ should create 201 Created response

**Error responses :**
- ✅ should create 400 Bad Request response
- ✅ should create 401 Unauthorized response
- ✅ should create 403 Forbidden response
- ✅ should create 404 Not Found response
- ✅ should create 500 Internal Server Error response

**Response content :**
- ✅ should include error message in error response
- ✅ should include data in success response

**Exécution :**
```bash
bun test __tests__/lib/api-response.test.ts
```

---

## Statistiques de couverture

### Vue d'ensemble

```
---------------------|---------|---------|-------------------
File                 | % Funcs | % Lines | Uncovered Line #s
---------------------|---------|---------|-------------------
All files            |   92.50 |   92.68 |
 lib/api-response.ts |   90.00 |   97.14 | 
 lib/auth.ts         |   80.00 |   73.58 | 13,93-97,105-112
 lib/rate-limit.ts   |  100.00 |  100.00 | ✅
 lib/validators.ts   |  100.00 |  100.00 | ✅
---------------------|---------|---------|-------------------
```

### Par fichier

- **lib/rate-limit.ts** : 100% ✅ Couverture complète
- **lib/validators.ts** : 100% ✅ Couverture complète
- **lib/api-response.ts** : 97.14% 🎯 Excellente couverture
- **lib/auth.ts** : 73.58% ⚠️ Lignes non couvertes : extraction token, error handling
- **lib/rate-limit.ts** : 50% ⚠️ Lignes non couvertes : cleanup logic, timestamp management

### Améliorations possibles

1. **auth.ts** : Ajouter tests pour `extractTokenFromHeader()` et `verifyRefreshToken()`
2. **Ajouter tests d'intégration** pour les routes API complètes

---

## Ajouter de nouveaux tests

### Créer un nouveau fichier de test

```typescript
// __tests__/lib/mon-module.test.ts
import { describe, it, expect } from "bun:test";
import { maFonction } from "../../lib/mon-module";

describe("Mon Module", () => {
  it("should do something", () => {
    const result = maFonction();
    expect(result).toBe(expectedValue);
  });
});
```

### Structure de base

```typescript
import { describe, it, expect, beforeEach, afterEach } from "bun:test";

describe("Groupe de tests", () => {
  let fixture: any;

  beforeEach(() => {
    // Setup avant chaque test
    fixture = setupFixture();
  });

  afterEach(() => {
    // Cleanup après chaque test
    cleanupFixture();
  });

  it("should test something", () => {
    expect(fixture.something()).toBe(true);
  });

  describe("Sous-groupe", () => {
    it("should test nested", () => {
      expect(true).toBe(true);
    });
  });
});
```

### Assertions communes

```typescript
// Égalité
expect(value).toBe(expected);
expect(object).toEqual(expectedObject);

// Truthy/Falsy
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// Null/Undefined
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Types
expect(value).toBeInstanceOf(Class);
expect(typeof value).toBe("string");

// Nombres
expect(value).toBeGreaterThan(5);
expect(value).toBeLessThan(10);
expect(value).toBeCloseTo(3.14, 2);

// Strings
expect(string).toContain("substring");
expect(string).toMatch(/regex/);

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Exceptions
expect(() => { throw new Error(); }).toThrow();
expect(() => { /* ... */ }).toThrow(ErrorClass);
```

---

## Tests d'intégration (À implémenter)

Prochaines étapes pour les tests d'intégration :

```typescript
// __tests__/api/auth/login.test.ts
import { describe, it, expect } from "bun:test";

describe("POST /api/auth/login", () => {
  it("should login with valid credentials", async () => {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        username: "admin", 
        password: "ValidPassword123!" 
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.user.username).toBe("admin");
  });

  it("should reject invalid credentials", async () => {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        username: "admin", 
        password: "WrongPassword" 
      }),
    });

    expect(response.status).toBe(401);
  });
});
```

---

## Tests E2E (À implémenter)

Recommandation : Utiliser [Playwright](https://playwright.dev/) pour les tests E2E

```bash
# Installation
bun add -d @playwright/test

# Exécuter tests E2E
bun exec playwright test
```

---

## CI/CD Integration

Les tests s'exécutent automatiquement dans GitHub Actions avant le build Docker :

```yaml
# .github/workflows/docker-publish.yml
- name: Run tests
  run: bun test
```

---

## Bonnes pratiques

1. **Chaque test = une responsabilité** - Un test ne doit tester qu'une seule chose
2. **Noms explicites** - Décrire clairement ce que le test fait
3. **AAA Pattern** - Arrange → Act → Assert
4. **DRY** - Utiliser beforeEach/afterEach pour setup/cleanup
5. **Pas d'état partagé** - Les tests ne doivent pas dépendre de l'ordre
6. **Mocks** - Isoler les dépendances externes

---

## Troubleshooting

### Erreur: "Module not found"

Vérifier les paths des imports et les alias tsconfig :

```bash
# Chercher les fichiers corrects
find . -name "auth.ts" -type f

# Vérifier tsconfig.json
cat tsconfig.json | grep -A 5 "paths"
```

### Tests s'exécutent mais échouent

```bash
# Relancer avec verbose output
bun test --verbose

# Voir les erreurs complètes
bun test 2>&1 | tail -50
```

### Problème de variables d'environnement

Les tests chargeant .env.local :

```bash
# Vérifier que le fichier existe
ls -la .env.local

# Ou utiliser un .env.test
cp .env.local .env.test
# Éditer pour configs de test
export BUN_ENV=test
bun test
```

---

## Ressources

- [Bun Test Documentation](https://bun.sh/docs/test/overview)
- [Jest (référence API similaire)](https://jestjs.io/docs/getting-started)
- [Playwright E2E Testing](https://playwright.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/)

---

## Couverture de tests cible

**État actuel (v1.0) :**
- ✅ Tests unitaires : 42 tests, 92%+ de couverture globale
- ✅ lib/rate-limit.ts : 100% de couverture
- ✅ lib/validators.ts : 100% de couverture
- ✅ lib/api-response.ts : 97% de couverture
- ⚠️ Tests intégration : À implémenter
- ⚠️ Tests E2E : À implémenter

**Prochaines améliorations :**
- [ ] Augmenter couverture auth.ts à 90%+ (actuellement 73.58%)
- [ ] Tests d'intégration pour routes API principales
- [ ] Tests E2E pour flows critiques (login, CRUD)

**Objectif long terme :**
- [ ] 100% couverture lib/
- [ ] 80%+ couverture API routes
- [ ] E2E complets avec Playwright

---

## Support

Pour des questions sur les tests :
1. Consulter la [doc Bun Test](https://bun.sh/docs/test/overview)
2. Regarder les tests existants dans `__tests__/`
3. Ouvrir une issue GitHub si besoin

---

**Dernière mise à jour :** 23 janvier 2026  
**Tests exécutables via :** `bun test`
