# 🐳 Tests E2E avec Playwright via Docker

## 📋 Pourquoi Docker ?

Sur Manjaro Linux (et autres distributions), l'installation des dépendances système pour Playwright peut être complexe. Docker résout ce problème en fournissant un environnement isolé avec toutes les dépendances pré-installées.

## 🚀 Utilisation

### Lancer tous les tests E2E

```bash
make test-e2e
```

Cette commande :
1. Construit l'image Docker avec Playwright
2. Lance les tests dans le conteneur
3. Génère un rapport HTML

### Mode UI interactif

```bash
make test-e2e-ui
```

Ouvre l'interface graphique Playwright pour exécuter les tests de manière interactive.

### Mode debug

```bash
make test-e2e-debug
```

Lance Playwright en mode debug avec l'inspecteur.

### Voir le rapport

```bash
make test-e2e-report
```

Affiche le rapport HTML des derniers tests exécutés.

### Mode headless (sans interface)

```bash
make test-e2e-headless
```

Exécute les tests sans interface graphique (par défaut).

## ⚙️ Prérequis

Avant de lancer les tests, assurez-vous que les services sont démarrés :

```bash
make start
```

Les tests E2E nécessitent :
- ✅ Backend Django sur `http://localhost:9193` (ou `backend:8000` dans Docker)
- ✅ Frontend Next.js sur `http://localhost:9194` (ou `frontend:3000` dans Docker)

## 📁 Structure

```
frontend/
├── Dockerfile.test          # Image Docker pour Playwright
├── playwright.config.ts     # Configuration Playwright
└── tests/e2e/
    ├── example.spec.ts      # Tests de base
    ├── auth.spec.ts         # Tests d'authentification
    ├── pages-management.spec.ts
    ├── api.spec.ts
    └── DOCKER.md           # Ce fichier
```

## 🔧 Configuration Docker

Le service `playwright` dans `docker-compose.yml` :
- Utilise l'image officielle Microsoft Playwright
- Monte le code source en volume
- Génère les rapports dans des volumes persistants
- Se connecte au réseau Docker pour accéder aux services

## 📊 Rapports et résultats

Les rapports sont générés dans :
- `playwright-report/` : Rapport HTML
- `test-results/` : Screenshots, vidéos, traces

Ces dossiers sont montés en volumes Docker pour persister les résultats.

## 🐛 Dépannage

### Les tests ne trouvent pas le frontend

Vérifiez que les services sont démarrés :
```bash
docker-compose ps
```

### Erreur de connexion

Les tests utilisent les noms de services Docker :
- `http://frontend:3000` (dans Docker)
- `http://localhost:9194` (local)

### Voir les logs

```bash
docker-compose --profile test logs playwright
```

### Reconstruire l'image

```bash
docker-compose --profile test build playwright
```

## 🎯 Exécution manuelle

Si vous voulez exécuter les tests manuellement dans le conteneur :

```bash
# Lancer un shell dans le conteneur
docker-compose --profile test run --rm playwright sh

# Puis exécuter les tests
npx playwright test
```

## 📝 Commandes disponibles

| Commande | Description |
|----------|-------------|
| `make test-e2e` | Lancer tous les tests E2E |
| `make test-e2e-ui` | Mode UI interactif |
| `make test-e2e-debug` | Mode debug |
| `make test-e2e-report` | Voir le rapport |
| `make test-e2e-headless` | Mode headless |

## ✅ Avantages Docker

- ✅ Pas besoin d'installer les dépendances système
- ✅ Environnement reproductible
- ✅ Fonctionne sur toutes les distributions Linux
- ✅ Isolation complète
- ✅ Facile à intégrer dans CI/CD

