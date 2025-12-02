# Tests E2E avec Playwright

## 🎯 Méthode recommandée : Docker

**Pour Manjaro Linux et autres distributions**, utilisez Docker :

```bash
make test-e2e
```

Voir [DOCKER.md](./DOCKER.md) pour plus de détails.

---

## 📋 Configuration

Les tests E2E sont configurés pour utiliser :
- **Frontend** : `http://localhost:9194` (ou `http://frontend:3000` dans Docker)
- **Backend API** : `http://localhost:9193/api` (ou `http://backend:8000/api` dans Docker)

## 🚀 Installation locale (optionnel)

Si vous voulez installer Playwright localement (non recommandé sur Manjaro) :

Les dépendances sont déjà installées via `npm install`.

Pour installer les navigateurs Playwright :
```bash
npx playwright install
```

## ▶️ Exécution des tests

### Tous les tests
```bash
npm run test:e2e
# ou
npx playwright test
```

### Tests spécifiques
```bash
npx playwright test tests/e2e/auth.spec.ts
```

### Mode interactif (UI)
```bash
npx playwright test --ui
```

### Mode debug
```bash
npx playwright test --debug
```

### Tests sur un navigateur spécifique
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## 📝 Structure des tests

- `example.spec.ts` - Tests de base (accueil, navigation)
- `auth.spec.ts` - Tests d'authentification
- `pages-management.spec.ts` - Tests de gestion des pages
- `api.spec.ts` - Tests des appels API

## ⚙️ Prérequis

Avant d'exécuter les tests, assurez-vous que :
1. Le backend Django est démarré sur `http://localhost:9193`
2. Le frontend Next.js est démarré sur `http://localhost:9194`

```bash
# Démarrer les services
make start
# ou
docker-compose up -d
```

## 🔍 Visualisation des résultats

Après l'exécution des tests, un rapport HTML est généré :
```bash
npx playwright show-report
```

## 📸 Screenshots et vidéos

Les screenshots et vidéos sont automatiquement capturés en cas d'échec et stockés dans `test-results/`.

## 🎯 Bonnes pratiques

1. **Isolation** : Chaque test doit être indépendant
2. **Données de test** : Utiliser des fixtures ou des données de test dédiées
3. **Sélecteurs** : Préférer les `data-testid` aux sélecteurs CSS fragiles
4. **Attentes** : Toujours attendre que les éléments soient visibles avant interaction

## 🔐 Tests avec authentification

Pour les tests nécessitant une authentification, vous pouvez :
1. Créer un utilisateur de test dans le backend
2. Utiliser `page.context().addCookies()` pour ajouter un token
3. Ou utiliser `page.request.post()` pour se connecter avant les tests

Exemple :
```typescript
test.beforeEach(async ({ page }) => {
  // Se connecter via l'API
  const response = await page.request.post('http://localhost:9193/api/auth/login/', {
    data: {
      email: 'test@example.com',
      password: 'testpassword'
    }
  });
  
  const { token } = await response.json();
  
  // Ajouter le token dans les cookies ou localStorage
  await page.addInitScript((token) => {
    localStorage.setItem('token', token);
  }, token);
});
```

