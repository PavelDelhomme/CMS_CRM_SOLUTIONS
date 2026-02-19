<<<<<<< HEAD
# Tests

## Structure des Tests

Les tests sont organisés par application :

- `backend-django/tests/` : Tests du backend Django
- `frontend/tests/` : Tests du frontend (à venir)

## Lancer les Tests

### Backend

```bash
cd backend-django
make test
```

Ou avec pytest directement :

```bash
pytest
```

Avec couverture :

```bash
pytest --cov=. --cov-report=html
```

### Frontend

```bash
cd frontend
npm test
```

## Écrire des Tests

### Backend (Django)

Utilisez pytest et pytest-django :

```python
import pytest
from pages.models import Page

@pytest.mark.django_db
def test_create_page():
    page = Page.objects.create(
        title="Test",
        slug="test"
    )
    assert page.title == "Test"
=======
# 🧪 Système de Tests Automatisés - CMS CRM Solutions

Ce répertoire contient tous les tests automatisés pour le projet CMS CRM Solutions.

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
>>>>>>> 5d3608bc72ef8a136d4f7474b6116932d35a591b
```

### Frontend (Next.js)

<<<<<<< HEAD
Utilisez Jest et React Testing Library :

```typescript
import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

test('renders home page', () => {
  render(<Home />)
  expect(screen.getByText('CMS_CRM_SOLUTIONS')).toBeInTheDocument()
})
```

=======
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

>>>>>>> 5d3608bc72ef8a136d4f7474b6116932d35a591b
