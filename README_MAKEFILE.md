# 📚 Guide du Makefile - VTCBuilder

## 🎯 Qu'est-ce que le Makefile ?

Le **Makefile** est un fichier qui automatise TOUTES les commandes nécessaires pour gérer votre projet. Au lieu de taper de longues commandes Docker, vous utilisez simplement `make <commande>`.

## ⚡ Avantages du Makefile

✅ **Simplicité** - Une seule commande au lieu de plusieurs
✅ **Rapidité** - Raccourcis pour toutes les actions
✅ **Cohérence** - Mêmes commandes pour toute l'équipe
✅ **Documentation** - Commandes auto-documentées
✅ **Productivité** - Gain de temps énorme

## 🚀 Comment l'Utiliser ?

### Voir Toutes les Commandes Disponibles

\`\`\`bash
make help
\`\`\`

Cette commande affiche TOUTES les commandes avec leurs descriptions.

### Exemples d'Utilisation

#### Démarrer le Projet

\`\`\`bash
# Au lieu de :
docker-compose up -d

# Utilisez :
make start
\`\`\`

#### Voir les Logs

\`\`\`bash
# Au lieu de :
docker-compose logs -f

# Utilisez :
make logs
\`\`\`

#### Exécuter une Migration

\`\`\`bash
# Au lieu de :
docker exec vtcbuilder_backend php artisan migrate

# Utilisez :
make migrate
\`\`\`

## 📋 Catégories de Commandes

### 🏗️ Installation
- `make install` - Installation initiale
- `make setup` - Installation COMPLÈTE avec tout
- `make build` - Reconstruire les images

### ▶️ Gestion Services
- `make start` - Démarrer
- `make stop` - Arrêter
- `make restart` - Redémarrer
- `make status` - Voir le statut

### 💾 Base de Données
- `make migrate` - Lancer migrations
- `make seed` - Insérer données test
- `make fresh` - Reset complet
- `make db-backup` - Backup

### 🔧 Backend
- `make composer-install` - Installer dépendances
- `make artisan cmd="xxx"` - Commande artisan
- `make bash-backend` - Terminal backend

### 🎨 Frontend
- `make npm-install` - Installer dépendances
- `make npm cmd="xxx"` - Commande npm
- `make bash-frontend` - Terminal frontend

### 🏢 Multi-Tenant
- `make tenant-create name="xxx"` - Créer client
- `make tenant-list` - Lister clients

## 🌟 Top 10 des Commandes les Plus Utiles

1. **`make setup`** - Installe TOUT automatiquement
2. **`make start`** - Démarre les services
3. **`make stop`** - Arrête les services
4. **`make logs`** - Voir les logs en direct
5. **`make migrate`** - Migrer la base
6. **`make fresh`** - Reset + migrate + seed
7. **`make tenant-create name="client1"`** - Créer un client
8. **`make bash-backend`** - Terminal backend
9. **`make db-backup`** - Backup DB
10. **`make help`** - Voir toutes les commandes

## 💡 Cas d'Usage Pratiques

### Démarrer votre Journée

\`\`\`bash
make start
make logs
\`\`\`

### Créer un Nouveau Contrôleur

\`\`\`bash
make artisan cmd="make:controller MonController"
\`\`\`

### Installer un Package NPM

\`\`\`bash
make npm cmd="install axios"
\`\`\`

### Créer un Backup avant Modifications

\`\`\`bash
make db-backup
# Fichier créé dans ./backups/
\`\`\`

### Problème ? Reset Complet

\`\`\`bash
make reset
\`\`\`

## 🎯 Workflows Complets

### Workflow 1 : Nouveau Client

\`\`\`bash
# Créer le tenant
make tenant-create name="nouveau-client"

# Vérifier
make tenant-list

# Migrer pour ce tenant
make tenant-migrate
\`\`\`

### Workflow 2 : Développement Backend

\`\`\`bash
# Entrer dans le container
make bash-backend

# Créer un contrôleur
php artisan make:controller Api/ClientController

# Créer un modèle avec migration
php artisan make:model Client -m

# Sortir
exit

# Migrer
make migrate
\`\`\`

### Workflow 3 : Développement Frontend

\`\`\`bash
# Installer une dépendance
make npm cmd="install @tanstack/react-query"

# Entrer dans le container pour développer
make bash-frontend
\`\`\`

## 🚨 Dépannage avec Make

### Services ne Démarrent Pas
\`\`\`bash
make clean
make install
make start
\`\`\`

### Erreur de Permissions
\`\`\`bash
make fix-permissions
\`\`\`

### Base de Données Corrompue
\`\`\`bash
make db-reset
\`\`\`

### Cache Problématique
\`\`\`bash
make clear-cache
\`\`\`

### Tout Réinitialiser
\`\`\`bash
make reset
\`\`\`

## 📚 Personnalisation

Vous pouvez éditer le `Makefile` pour ajouter vos propres commandes :

\`\`\`makefile
ma-commande: ## Description de ma commande
	@echo "Exécution de ma commande"
	docker exec vtcbuilder_backend php artisan custom:command
\`\`\`

Puis utilisez : `make ma-commande`

## 🏆 Pourquoi c'est Génial ?

Sans Make (Ancien) :
\`\`\`bash
docker-compose up -d
docker exec vtcbuilder_backend composer install --no-interaction
docker exec vtcbuilder_backend php artisan key:generate
docker exec vtcbuilder_backend php artisan migrate --force
docker exec vtcbuilder_backend php artisan db:seed
\`\`\`

Avec Make (Nouveau) :
\`\`\`bash
make setup
\`\`\`

**5 commandes → 1 commande !** 🎉

## 📖 Pour Aller Plus Loin

- Consultez `COMMANDES.md` pour la liste exhaustive
- Utilisez `make help` pour voir toutes les options
- Lisez le `Makefile` pour comprendre ce qui se passe

---

**Le Makefile est votre meilleur ami pour gérer ce projet ! 🚀**
