# 🔧 CMS_CRM_SOLUTIONS - Plateforme Générique

> **🚀 Plateforme générique multi-tenant pour créer des solutions CMS/CRM personnalisées**

CMS_CRM_SOLUTIONS est une plateforme complète et générique qui permet de développer rapidement des solutions CMS/CRM personnalisées sans réinventer la roue.

## ✨ Fonctionnalités

### 🏢 Multi-Tenant
- Architecture multi-tenant avec isolation complète des données
- Schémas PostgreSQL séparés par tenant
- Routage automatique par sous-domaine
- Gestion centralisée des clients

### 📝 CMS Complet
- Gestion de pages avec éditeur
- Système de blocs réutilisables
- Gestion de contenu flexible
- Gestion des médias

### 💳 Facturation
- Intégration Stripe
- Gestion des abonnements
- Facturation automatisée

### 🔐 Sécurité
- Authentification JWT
- Isolation complète des données
- CORS configuré
- Headers de sécurité

### 🚀 Performance
- Cache Redis
- Optimisations base de données
- CDN ready

## ⚡ Performance et coût en ressources

Pour **minimiser l’usage CPU/RAM** et voir un **comparatif complet des technologies** (backend : Python, Go, Rust, Node… ; frontend : React, Next.js, Vue, Svelte… ; BDD : PostgreSQL, MySQL, MariaDB… ; cache, orchestration Docker), voir :

- **[docs/PERFORMANCE_OPTIONS.md](docs/PERFORMANCE_OPTIONS.md)** — comparatif détaillé et recommandations (tout passe par Docker).  
- **[docs/MIGRATION_STACK.md](docs/MIGRATION_STACK.md)** — plan de migration vers une stack plus performante (Rust/Go + frontend efficace), sans perte de fonctionnalité, sous Docker.

En production : `docker-compose.prod.yml` (Gunicorn, Next.js build+start, limites mémoire). En dev : runserver + next dev (plus gourmand mais pratique).

---

## 🏗️ Architecture

```
CMS_CRM_SOLUTIONS (Core Générique)
    │
    ├── Multi-tenant Architecture
    ├── Billing System
    ├── Template Engine
    ├── Block System
    ├── User Management
    ├── API Framework
    └── Admin Dashboard
```

## 🛠️ Stack Technologique

- **Backend**: Django 5.0.1 (Python 3.12)
- **Frontend**: Next.js 14 (React 18 + TypeScript)
- **Base de données**: PostgreSQL 15
- **Cache**: Redis 7
- **Conteneurisation**: Docker & Docker Compose
- **Reverse Proxy**: Nginx

## 🚀 Démarrage Rapide

### Prérequis

- Docker & Docker Compose
- Git
- Make (optionnel)

### Installation

```bash
# 1. Cloner le projet
git clone git@github.com:PavelDelhomme/CMS_CRM_SOLUTIONS.git
cd CMS_CRM_SOLUTIONS

# 2. Créer le .env (obligatoire avant le premier démarrage)
cp .env.example .env
# Éditer .env si besoin (DB, SECRET_KEY, etc.)

# 3. Installation complète (ou docker-compose up -d)
make setup

# 4. Démarrer les services
make start

# 5. Créer un super utilisateur
make superuser
```

## 🔐 Accès

- **Frontend**: http://localhost:9194
- **API**: http://localhost:9193/api
- **Admin**: http://localhost:9193/admin
- **API Docs**: http://localhost:9193/api/docs

## 📚 Documentation

- [Guide d'Installation](docs/INSTALLATION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Documentation API](docs/API.md)
- [Guide de Contribution](docs/CONTRIBUTING.md)

## 🧪 Tests

```bash
# Backend
cd backend-django && make test

# Frontend
cd frontend && npm test
```

## 📦 Structure du Projet

```
CMS_CRM_SOLUTIONS/
├── backend-django/       # Backend Django
├── frontend/             # Frontend Next.js
├── docker/               # Configuration Docker
├── scripts/              # Scripts d'automatisation
├── docs/                 # Documentation
└── tests/                # Tests
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](docs/CONTRIBUTING.md) pour plus d'informations.

## 📝 License

MIT License - voir le fichier LICENSE pour plus de détails.

## 🔗 Liens

- **Dépôt GitHub**: https://github.com/PavelDelhomme/CMS_CRM_SOLUTIONS
- **Branche dev**: https://github.com/PavelDelhomme/CMS_CRM_SOLUTIONS/tree/dev
- **VTCBuilder** (projet source): https://github.com/PavelDelhomme/VTCBuilder

## 👨‍💻 Auteur

Développé avec ❤️ pour créer la meilleure solution SaaS multi-tenant générique.

---

**⭐ Si ce projet vous plaît, n'oubliez pas de lui donner une étoile !**

