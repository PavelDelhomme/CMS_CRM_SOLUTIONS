# 🚀 VTCBuilder - Plateforme SaaS Multi-Tenant pour Chauffeurs VTC

La solution professionnelle pour créer et gérer des sites web pour chauffeurs VTC avec un système multi-tenant complet.

**Le WordPress des chauffeurs VTC** - Créez votre site VTC professionnel en 2 minutes !

## 📋 Fonctionnalités Principales

### 🔧 Backoffice Super Admin
- Gestion complète de tous les clients/tenants
- Déploiement automatique de nouveaux sites
- Analytics et statistiques globales
- Facturation automatisée
- Monitoring des performances

### 👥 Interface Client
- Éditeur de contenu visuel (WYSIWYG)
- Gestion des pages et des médias
- Personnalisation du design
- Analytics du site
- Gestion des formulaires et réservations

### 🌐 Sites Web Générés
- Templates responsive modernes
- SEO optimisé
- Performance optimale
- Sécurité renforcée
- Sous-domaines automatiques

## 🏗️ Architecture Technique

### Stack Technologique
- **Backend**: Laravel 11 (PHP 8.2+)
- **Frontend**: React 18 + Next.js 14
- **Base de données**: MySQL 8.0
- **Cache**: Redis
- **Conteneurisation**: Docker
- **Proxy**: Traefik (routage automatique)

### Architecture Multi-Tenant
- **Isolation**: tenant_id dans une base de données unique
- **Routage**: Sous-domaines automatiques (client.votredomaine.com)
- **Sécurité**: Middleware d'isolation des données
- **Scalabilité**: Docker containers par client

## 📦 Structure du Projet

```
VTCBuilder/
├── backend/              # Laravel API
├── frontend/             # React/Next.js Admin & Client Interfaces
├── public-site/          # Templates de sites VTC générés
├── docker/               # Configuration Docker
├── database/             # Migrations et seeds
└── docs/                 # Documentation
```

## 🚀 Installation

### Prérequis
- Docker & Docker Compose
- Node.js 18+
- PHP 8.2+
- Composer

### Démarrage Rapide

```bash
# Cloner le projet
git clone <repo-url>
cd VTCBuilder

# Démarrer avec Docker
docker-compose up -d

# Installer les dépendances backend
cd backend
composer install
php artisan migrate --seed

# Installer les dépendances frontend
cd ../frontend
npm install
npm run dev
```

## 🔐 Accès par Défaut

- **Super Admin**: http://localhost:3000/admin
  - Email: admin@example.com
  - Password: admin123

- **Client Demo**: http://localhost:3000/client
  - Email: client@example.com
  - Password: client123

## 📊 Modèle Commercial

### Tarification Suggérée
- **Starter**: 29€/mois - 1 site, fonctionnalités de base
- **Business**: 49€/mois - 1 site, toutes fonctionnalités
- **Enterprise**: 99€/mois - Sites illimités, white-label

### Coûts de Revient (50 clients)
- Serveur VPS: 200€/mois
- APIs & Services: 100€/mois
- Outils: 50€/mois
- **Total**: 350€/mois = 7€/client/mois

### Marges
- Starter: 22€/client (76%)
- Business: 42€/client (86%)
- Enterprise: 92€/client (93%)

## 🛠️ Développement

### Commandes Utiles

```bash
# Backend (Laravel)
php artisan tenant:create          # Créer un nouveau tenant
php artisan tenant:migrate         # Migrer les tenants
php artisan serve                  # Démarrer le serveur

# Frontend (React)
npm run dev                        # Mode développement
npm run build                      # Build production
npm run lint                       # Linter

# Docker
docker-compose up -d               # Démarrer tous les services
docker-compose logs -f             # Voir les logs
docker-compose down                # Arrêter les services
```

## 📈 Roadmap

### Phase 1 - MVP (4 semaines)
- [x] Architecture multi-tenant Laravel
- [x] Interface Super Admin basique
- [x] Template responsive
- [x] Éditeur de contenu simple
- [x] Déploiement Docker

### Phase 2 - Version Complète (6 semaines)
- [ ] Éditeur visuel avancé (drag & drop)
- [ ] Système de templates multiples
- [ ] Analytics et statistiques
- [ ] Facturation Stripe
- [ ] API REST complète

### Phase 3 - Scaling (8 semaines)
- [ ] Marketplace de templates
- [ ] White-label complet
- [ ] App mobile
- [ ] Intégrations tierces

## 📝 License

Propriétaire - Tous droits réservés

## 👨‍💻 Auteur

Développé avec ❤️ pour créer la meilleure solution SaaS multi-tenant

