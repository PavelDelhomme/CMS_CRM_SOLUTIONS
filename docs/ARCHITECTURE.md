# 🏗️ Architecture

## Vue d'ensemble

CMS_CRM_SOLUTIONS est une plateforme générique multi-tenant construite avec Django et Next.js.

## Architecture Multi-Tenant

### Principe

Chaque client (tenant) possède :
- Son propre schéma PostgreSQL
- Son propre domaine/sous-domaine
- Ses propres données isolées
- Sa propre configuration

### Schéma Public

Le schéma `public` contient :
- Les informations des tenants (Client, Domain)
- Les données partagées entre tous les tenants
- L'administration globale

### Schémas Tenants

Chaque tenant a son propre schéma contenant :
- Pages CMS
- Contenu
- Médias
- Utilisateurs
- Configuration spécifique

## Structure du Projet

```
CMS_CRM_SOLUTIONS/
├── backend-django/          # Backend Django
│   ├── core/               # Configuration Django
│   ├── tenants/            # Gestion multi-tenant
│   ├── pages/              # CMS Pages
│   ├── content/            # Gestion de contenu
│   ├── blocks/             # Blocs réutilisables
│   ├── media/              # Gestion des médias
│   ├── billing/            # Facturation
│   └── api/                # API REST
├── frontend/               # Frontend Next.js
│   ├── app/               # Pages Next.js 14 (App Router)
│   ├── components/        # Composants React
│   └── lib/               # Utilitaires
├── docker/                # Configuration Docker
│   └── nginx/             # Configuration Nginx
├── scripts/               # Scripts d'automatisation
├── docs/                  # Documentation
└── tests/                 # Tests
```

## Stack Technologique

Stack actuel (choix cohérent avec l’architecture multi-tenant et le coût en ressources). Pour un **comparatif complet des alternatives** (Python, Go, Rust, Node, React, Vue, Svelte, PostgreSQL, MySQL, MariaDB, Redis, Docker Compose, Kubernetes, etc.) et le “moins coûteux en ressources”, voir **docs/PERFORMANCE_OPTIONS.md**.

**Cible de migration (choix projet)** : Backend **Rust** (Axum), Frontend **SvelteKit**, BDD **PostgreSQL** et **Redis** conservés, **Docker Compose** conservé. Stratégie **Strangler fig** (voir **docs/MIGRATION_STACK.md**). Plan des étapes : **STATUS.md**.

### Backend

- **Django 5.0.1** : Framework web Python
- **django-tenants** : Multi-tenancy avec schémas PostgreSQL
- **Django REST Framework** : API REST
- **PostgreSQL 15** : Base de données
- **Redis 7** : Cache et sessions
- **Celery** : Tâches asynchrones

### Frontend

- **Next.js 14** : Framework React avec App Router
- **TypeScript** : Typage statique
- **Tailwind CSS** : Framework CSS
- **React Query** : Gestion des données
- **Zustand** : State management

### Infrastructure

- **Docker** : Conteneurisation (obligatoire pour déploiement)
- **Docker Compose** : Orchestration (recommandé ; voir PERFORMANCE_OPTIONS.md pour Kubernetes, Swarm, etc.)
- **Nginx** : Reverse proxy
- **Traefik** : Routage (production)

## Flux de Données

### Requête API

1. Client fait une requête HTTP
2. Nginx route vers le backend
3. Middleware TenantMainMiddleware identifie le tenant
4. Django route vers la vue appropriée
5. Vue interroge le schéma du tenant
6. Réponse JSON retournée

### Authentification

- JWT (JSON Web Tokens) pour l'API
- Sessions Django pour l'admin
- Tokens stockés côté client (localStorage/cookies)

## Sécurité

### Isolation des Données

- Chaque tenant a son propre schéma PostgreSQL
- Middleware garantit l'isolation
- Pas d'accès croisé entre tenants

### Authentification

- JWT avec expiration
- Refresh tokens
- CORS configuré
- CSRF protection

### Production

- HTTPS obligatoire
- Secrets dans variables d'environnement
- Headers de sécurité
- Rate limiting (à implémenter)

## Scalabilité

### Horizontal

- Plusieurs instances backend (load balancing)
- Redis pour sessions partagées
- PostgreSQL avec réplication

### Vertical

- Optimisation des requêtes
- Cache Redis
- CDN pour les médias statiques

## Déploiement

### Développement

- Docker Compose local
- Hot reload activé
- Debug activé

### Production

- Docker Compose avec configuration optimisée (`docker-compose.prod.yml`)
- **Gunicorn** pour Django (`config.core.wsgi`), workers configurables via `GUNICORN_WORKERS`
- **Next.js** : `npm run build` + `npm start` (jamais `npm run dev`)
- Nginx pour reverse proxy
- Limites mémoire sur les conteneurs (backend, frontend, db, redis, nginx)
- Redis avec `maxmemory` pour limiter la RAM
- Certificats SSL (Let's Encrypt)
- Sauvegardes automatiques

Voir **docs/PERFORMANCE_OPTIONS.md** pour le détail des options et le coût en ressources.

## Extensibilité

### Ajouter une nouvelle App

1. Créer l'app Django dans `backend-django/`
2. Ajouter à `TENANT_APPS` ou `SHARED_APPS`
3. Créer les migrations
4. Créer les vues API si nécessaire
5. Créer les composants frontend

### Ajouter une fonctionnalité

1. Modifier les modèles si nécessaire
2. Créer les migrations
3. Créer les serializers API
4. Créer les vues API
5. Créer les composants frontend
6. Ajouter les tests

