# 🔧 CMS_CRM_SOLUTIONS - Plateforme Générique

> **🚀 Projet en développement actif**
> 
> CMS_CRM_SOLUTIONS est une plateforme générique pour créer des solutions CMS/CRM personnalisées.
> 
> Le code générique est extrait et basé sur [VTCBuilder](https://github.com/PavelDelhomme/VTCBuilder).

## 🎯 Objectif

Créer une plateforme réutilisable qui permet de :
- Développer rapidement des solutions CMS/CRM personnalisées
- Réutiliser le core multi-tenant, billing, templates, blocks
- Créer de nouvelles solutions sans réinventer la roue

## 📦 Architecture

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
         │
         └── VTCBuilder (Implémentation VTC)
              └── Utilise CMS_CRM_SOLUTIONS comme base
```

## 🚀 Statut

- [x] Dépôt GitHub créé
- [x] Structure de base initialisée
- [x] Extraction du code générique depuis VTCBuilder
- [ ] Documentation complète
- [ ] Exemples d'utilisation

> **📊 Pour suivre l'avancement détaillé, consultez [STATUS.md](https://github.com/PavelDelhomme/CMS_CRM_SOLUTIONS/blob/dev/STATUS.md) sur GitHub**

## 📚 Documentation

Voir [EXTRACTION_PLAN.md](../VTCBuilder/EXTRACTION_PLAN.md) dans le projet VTCBuilder pour le plan d'extraction.

## 🔗 Liens

- **VTCBuilder** (projet source) : https://github.com/PavelDelhomme/VTCBuilder
- **CMS_CRM_SOLUTIONS** (dépôt principal) : https://github.com/PavelDelhomme/CMS_CRM_SOLUTIONS
- **Branche de développement** : https://github.com/PavelDelhomme/CMS_CRM_SOLUTIONS/tree/dev

## 📁 Structure du Projet

Le projet contient actuellement :

- **backend-django/** : Backend Django avec architecture multi-tenant
- **frontend/** : Application Next.js (React + TypeScript)
- **docker/** : Configuration Docker et Nginx
- **public-site/** : Templates de sites publics
- **docs/** : Documentation du projet
- **scripts/** : Scripts d'automatisation
- **tests/** : Tests automatisés
- **.github/workflows/** : CI/CD GitHub Actions

## 🛠️ Technologies Utilisées

- **Backend**: Django 5.0.1 (Python 3.12)
- **Frontend**: Next.js 14 (React 18 + TypeScript)
- **Base de données**: PostgreSQL 15
- **Cache**: Redis 7
- **Conteneurisation**: Docker & Docker Compose
- **Reverse Proxy**: Traefik

## 📚 Documentation Complémentaire

- [SYSTEM_OVERVIEW.md](https://github.com/PavelDelhomme/CMS_CRM_SOLUTIONS/blob/dev/SYSTEM_OVERVIEW.md) : Vue d'ensemble du système
- [STATUS.md](https://github.com/PavelDelhomme/CMS_CRM_SOLUTIONS/blob/dev/STATUS.md) : État actuel du projet
- Voir [EXTRACTION_PLAN.md](../VTCBuilder/EXTRACTION_PLAN.md) dans le projet VTCBuilder pour le plan d'extraction

