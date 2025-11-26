# 🧪 Système de Tests Automatisés - VTCBuilder

Ce répertoire contient tous les tests automatisés pour le projet VTCBuilder.

## 📋 Structure

```
tests/
├── backend/          # Tests backend Django
│   ├── unit/        # Tests unitaires
│   ├── integration/ # Tests d'intégration
│   └── e2e/         # Tests end-to-end
├── frontend/        # Tests frontend Next.js
│   ├── unit/        # Tests unitaires React
│   ├── integration/ # Tests d'intégration
│   └── e2e/         # Tests E2E avec Playwright
└── api/             # Tests API REST
    ├── endpoints/   # Tests par endpoint
    └── workflows/   # Tests de workflows complets
```

## 🚀 Exécution des Tests

### Backend (Django)

```bash
# Tous les tests
cd backend-django
python manage.py test

# Tests spécifiques
python manage.py test tenants.tests
python manage.py test billing.tests

# Avec couverture
coverage run --source='.' manage.py test
coverage report
```

### Frontend (Next.js)

```bash
# Tests unitaires
cd frontend
npm run test

# Tests E2E
npm run test:e2e

# Avec watch mode
npm run test:watch
```

### Tests API

```bash
# Tests d'endpoints API
pytest tests/api/endpoints/

# Tests de workflows
pytest tests/api/workflows/
```

## 📊 Checklist de Tests

### ✅ Backend - Tests Unitaires

- [ ] Modèles (Tenant, User, Subscription, Invoice, Payment)
- [ ] Serializers
- [ ] Views/ViewSets
- [ ] Permissions
- [ ] Email sending
- [ ] Multi-tenant isolation

### ✅ Frontend - Tests Unitaires

- [ ] Composants React
- [ ] Pages Next.js
- [ ] Services (API calls)
- [ ] Hooks personnalisés
- [ ] Utilitaires

### ✅ API - Tests d'Intégration

- [ ] Authentification (login, register, password reset)
- [ ] CRUD Tenants
- [ ] CRUD Users
- [ ] CRUD Subscriptions
- [ ] CRUD Invoices
- [ ] CRUD Templates
- [ ] Statistics endpoints
- [ ] Settings endpoints

### ✅ E2E - Tests End-to-End

- [ ] Parcours super admin
- [ ] Parcours tenant admin
- [ ] Création d'un tenant
- [ ] Inscription utilisateur
- [ ] Reset password
- [ ] Gestion facturation
- [ ] Gestion templates

## 🔧 Configuration

Les tests utilisent des bases de données de test séparées pour éviter de polluer les données de développement.

## 📝 Ajout de Nouveaux Tests

1. Créer un fichier de test dans le répertoire approprié
2. Suivre les conventions de nommage : `test_*.py` ou `*.test.ts`
3. Ajouter des docstrings pour expliquer ce qui est testé
4. Utiliser des fixtures pour les données de test réutilisables

