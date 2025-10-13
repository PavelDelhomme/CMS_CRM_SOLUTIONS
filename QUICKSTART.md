# 🚀 Guide de Démarrage Rapide - VTCBuilder

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)
- **Make** (généralement préinstallé sur Linux/Mac)

### Vérifier les installations

```bash
docker --version
docker-compose --version
make --version
```

## 🎯 Installation en 3 Étapes

### 1. Cloner ou naviguer dans le projet

```bash
cd /home/pactivisme/Documents/Dev/Perso/VTCBuilder
```

### 2. Installation complète automatique

```bash
make setup
```

Cette commande va :
- ✅ Créer le fichier `.env`
- ✅ Construire toutes les images Docker
- ✅ Démarrer tous les services
- ✅ Installer les dépendances backend (Composer)
- ✅ Exécuter les migrations de base de données
- ✅ Insérer les données de test
- ✅ Configurer l'application

### 3. Accéder à l'application

Une fois l'installation terminée, vous verrez les URLs disponibles :

```
🚀 Application disponible :
   Frontend: http://localhost:3000
   API: http://localhost:8000
   PhpMyAdmin: http://localhost:8081
   Traefik Dashboard: http://localhost:8080
```

## 🎮 Commandes Principales

### Voir toutes les commandes disponibles

```bash
make help
```

### Gestion des services

```bash
make start          # Démarrer tous les services
make stop           # Arrêter tous les services
make restart        # Redémarrer tous les services
make status         # Voir le statut des services
make logs           # Voir tous les logs en temps réel
```

### Développement Backend (Laravel)

```bash
make migrate        # Exécuter les migrations
make seed           # Insérer les données de test
make fresh          # Reset DB + migrations + seeders
make artisan cmd="route:list"  # Exécuter une commande artisan
make bash-backend   # Accéder au terminal du backend
```

### Développement Frontend (React)

```bash
make npm-install    # Installer les dépendances npm
make npm-build      # Build du frontend
make npm cmd="run lint"  # Exécuter une commande npm
make bash-frontend  # Accéder au terminal du frontend
```

### Gestion Multi-Tenant

```bash
make tenant-create name="client1"  # Créer un nouveau tenant
make tenant-list                   # Lister tous les tenants
make tenant-migrate                # Migrer les tenants
```

### Base de données

```bash
make db-cli         # Accéder à MySQL CLI
make db-backup      # Créer un backup
make db-reset       # Reset complet de la DB
```

### Logs et Debugging

```bash
make logs           # Tous les logs
make logs-backend   # Logs du backend uniquement
make logs-frontend  # Logs du frontend uniquement
make logs-db        # Logs de la base de données
```

### Nettoyage et Reset

```bash
make clean          # Nettoyer les containers et volumes
make clean-all      # Nettoyage complet + images
make reset          # Reset complet du projet
```

## 🔑 Comptes par Défaut

### Super Admin

- **URL**: http://localhost:3000/admin
- **Email**: admin@example.com
- **Password**: admin123

### Client Demo

- **URL**: http://localhost:3000/client
- **Email**: client@example.com
- **Password**: client123

## 📊 URLs des Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Interface principale |
| Backend API | http://localhost:8000 | API REST Laravel |
| PhpMyAdmin | http://localhost:8081 | Gestion base de données |
| Traefik Dashboard | http://localhost:8080 | Monitoring reverse proxy |

## 🐛 Dépannage

### Les containers ne démarrent pas

```bash
make clean
make install
make start
```

### Erreur de permissions

```bash
make fix-permissions
```

### Base de données corrompue

```bash
make db-reset
```

### Problème de cache Laravel

```bash
make clear-cache
```

### Tout réinitialiser

```bash
make reset
```

## 📝 Workflow de Développement

### 1. Démarrer la journée

```bash
make start          # Démarrer les services
make logs           # Suivre les logs
```

### 2. Pendant le développement

```bash
# Backend
make bash-backend   # Accéder au container
# Faire vos modifications
make migrate        # Si nouvelles migrations
make clear-cache    # Si changements de config

# Frontend
make bash-frontend  # Accéder au container
# Faire vos modifications
```

### 3. Tests

```bash
make test           # Lancer les tests backend
make test-coverage  # Tests avec couverture
```

### 4. Fin de journée

```bash
make stop           # Arrêter les services (optionnel)
```

## 🚀 Déploiement Production

```bash
make prod-deploy    # Déploiement complet en production
```

## 📚 Documentation Complète

Pour plus de détails, consultez :
- [README.md](./README.md) - Documentation principale
- [Documentation API](./docs/api.md) - Documentation de l'API
- [Architecture](./docs/architecture.md) - Architecture du projet

## 💡 Astuces

### Commandes Personnalisées

Vous pouvez exécuter n'importe quelle commande dans les containers :

```bash
# Artisan
make artisan cmd="make:controller MonController"

# NPM
make npm cmd="install --save axios"

# Composer
docker exec vtcbuilder_backend composer require package/name
```

### Accès Direct MySQL

```bash
make db-cli
# ou
docker exec -it vtcbuilder_mysql mysql -u vtcbuilder_user -pvtcbuilder_password vtcbuilder
```

### Voir toutes les URLs

```bash
make urls
```

## ❓ Besoin d'Aide ?

Utilisez toujours `make help` pour voir toutes les commandes disponibles avec leurs descriptions.

---

**Bon développement ! 🎉**

