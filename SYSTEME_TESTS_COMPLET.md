# 🧪 Système de Tests Complet - VTCBuilder

## 📋 Vue d'ensemble

Ce document décrit le système complet de tests unitaires mis en place pour tester **chaque fonction, chaque widget, chaque composant** du frontend et du backend.

## 🎯 Objectif

Tester **TOUT** :
- ✅ Chaque service frontend (auth, user, tenant, billing, etc.)
- ✅ Chaque composant frontend (AdminLayout, Sidebar, etc.)
- ✅ Chaque vue backend (API endpoints)
- ✅ Chaque modèle backend
- ✅ Chaque fonction utilitaire

## 🚀 Utilisation

### Tester tout le projet (frontend + backend)
```bash
make test
```

### Tester uniquement le frontend
```bash
make test-frontend
# ou
cd frontend && npm test
```

### Tester uniquement le backend
```bash
make test-backend
# ou
cd backend-django && make test
```

### Tests avec couverture de code
```bash
make test-coverage
```

## 📁 Structure des Tests

### Frontend
```
frontend/
├── src/
│   ├── __tests__/
│   │   ├── services/
│   │   │   ├── auth.service.test.ts
│   │   │   ├── user.service.test.ts
│   │   │   ├── tenant.service.test.ts
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── AdminLayout.test.tsx
│   │   │   ├── AdminSidebar.test.tsx
│   │   │   └── ...
│   │   └── utils/
│   │       └── ...
│   └── ...
├── jest.config.js
└── jest.setup.js
```

### Backend
```
backend-django/
├── tenants/
│   ├── tests/
│   │   ├── test_models.py
│   │   ├── test_views.py
│   │   ├── test_serializers.py
│   │   └── ...
├── billing/
│   ├── tests/
│   │   └── ...
└── ...
```

## ✅ Tests Implémentés

### Frontend - Services (10 services)
- ✅ auth.service.ts
- ✅ user.service.ts
- ✅ tenant.service.ts
- ✅ billing.service.ts
- ✅ page.service.ts
- ✅ service.service.ts
- ✅ booking.service.ts
- ✅ media.service.ts
- ✅ template.service.ts
- ✅ settings.service.ts

### Frontend - Composants (11 composants)
- ✅ AdminLayout
- ✅ AdminSidebar
- ✅ TenantLayout
- ✅ Sidebar
- ✅ MobileHeader
- ✅ ResponsiveTable
- ✅ ImpersonationBanner
- ✅ Navbar
- ✅ PublicHeader
- ✅ PublicFooter
- ✅ PublicLayout

### Backend - Modèles
- ✅ Tenant model
- ✅ User model
- ✅ PricingPlan model
- ✅ Subscription model
- ✅ Invoice model
- ✅ Payment model
- ✅ Page model
- ✅ Service model
- ✅ Booking model
- ✅ Template model

### Backend - Vues/API
- ✅ Authentication endpoints
- ✅ User management endpoints
- ✅ Tenant management endpoints
- ✅ Billing endpoints
- ✅ Page management endpoints
- ✅ Service management endpoints
- ✅ Booking management endpoints
- ✅ Media management endpoints
- ✅ Template management endpoints

## 📊 Couverture de Code

Le système est configuré pour maintenir une couverture minimale de **70%** pour :
- Branches
- Functions
- Lines
- Statements

## 🔧 Configuration

### Frontend (Jest)
- Configuration : `frontend/jest.config.js`
- Setup : `frontend/jest.setup.js`
- Framework : Jest + React Testing Library

### Backend (pytest)
- Configuration : `backend-django/pytest.ini`
- Framework : pytest + pytest-django
- Factory : factory-boy pour fixtures

## 📝 Exécution des Tests

Tous les tests sont exécutés automatiquement avec :
```bash
make test
```

Cette commande :
1. Lance les tests backend (pytest)
2. Lance les tests frontend (Jest)
3. Génère un rapport de couverture
4. Affiche un résumé complet

