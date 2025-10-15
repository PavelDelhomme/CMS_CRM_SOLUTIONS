.PHONY: help install setup start stop restart build logs clean migrate migrations migrate-fresh superuser shell dbshell collectstatic test lint format logs-backend logs-db logs-redis npm-install npm-build npm-dev npm bash-backend bash-frontend db-cli

# Variables
DOCKER_COMPOSE = docker-compose
BACKEND_CONTAINER = vtcbuilder_backend
FRONTEND_CONTAINER = vtcbuilder_frontend
MYSQL_CONTAINER = vtcbuilder_mysql
NGINX_CONTAINER = vtcbuilder_nginx

# Couleurs pour l'affichage
BLUE = \033[0;34m
GREEN = \033[0;32m
YELLOW = \033[0;33m
RED = \033[0;31m
NC = \033[0m # No Color

##@ Aide

help: ## Afficher l'aide
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo "$(GREEN)    VTCBuilder Django - Commandes disponibles$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@awk 'BEGIN {FS = ":.*##"; printf "\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)📁 Commandes Backend Django (backend-django/):$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@cd backend-django && make help | grep -E "(install|setup|start|stop|restart|build|logs|clean|migrate|superuser|shell|test|lint|format|urls)" | sed 's/^/  /'
	@echo ""
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)📁 Commandes Frontend (frontend/):$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "  $(YELLOW)npm-install         $(NC) Installer les dépendances npm"
	@echo "  $(YELLOW)npm-build           $(NC) Build du frontend"
	@echo "  $(YELLOW)npm-dev             $(NC) Démarrer le mode développement"
	@echo "  $(YELLOW)npm                 $(NC) Exécuter une commande npm"

##@ Installation et Configuration

install: ## Installation complète du projet
	@echo "$(GREEN)📦 Installation du projet VTCBuilder Django...$(NC)"
	@echo "$(GREEN)🐳 Construction des images Docker...$(NC)"
	@cd backend-django && $(MAKE) install
	@echo "$(GREEN)✅ Installation terminée !$(NC)"
	@echo "$(BLUE)Utilisez 'make start' pour démarrer le projet$(NC)"

setup: ## Installation et configuration complète
	@echo "$(GREEN)✨ Configuration complète Django...$(NC)"
	@echo "$(YELLOW)📦 Installation du backend Django...$(NC)"
	@cd backend-django && $(MAKE) install
	@echo "$(YELLOW)🗄️  Configuration des migrations...$(NC)"
	@cd backend-django && $(MAKE) migrate
	@echo "$(YELLOW)🔐 Configuration des permissions...$(NC)"
	@cd backend-django && $(MAKE) setup-permissions
	@echo "$(GREEN)✅ Configuration terminée !$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)🚀 Application disponible :$(NC)"
	@echo "   Frontend: http://localhost:3004"
	@echo "   API Django: http://localhost:8088/api/"
	@echo "   Admin Django: http://localhost:8088/admin/"
	@echo "   PgAdmin: http://localhost:8084"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"

##@ Gestion des Containers

start: ## Démarrer tous les services
	@echo "$(GREEN)🚀 Démarrage des services Django...$(NC)"
	@cd backend-django && $(MAKE) start
	@echo "$(GREEN)✅ Services démarrés !$(NC)"

up: ## Démarrer tous les services
	@echo "$(GREEN)🚀 Démarrage des services Django...$(NC)"
	@cd backend-django && $(MAKE) start
	@echo "$(GREEN)✅ Services démarrés !$(NC)"


stop: ## Arrêter tous les services
	@echo "$(YELLOW)⏸️  Arrêt des services...$(NC)"
	@cd backend-django && $(MAKE) stop
	@echo "$(GREEN)✅ Services arrêtés !$(NC)"

restart: ## Redémarrer tous les services
	@echo "$(YELLOW)🔄 Redémarrage des services...$(NC)"
	@cd backend-django && $(MAKE) restart
	@echo "$(GREEN)✅ Services redémarrés !$(NC)"

down: ## Arrêter et supprimer tous les containers
	@echo "$(RED)🗑️  Suppression des containers...$(NC)"
	@cd backend-django && $(MAKE) down
	@echo "$(GREEN)✅ Containers supprimés !$(NC)"

build: ## Reconstruire les images Docker
	@echo "$(GREEN)🔨 Reconstruction des images...$(NC)"
	@cd backend-django && $(MAKE) build
	@echo "$(GREEN)✅ Images reconstruites !$(NC)"

rebuild: ## Tout reconstruire et redémarrer
	@echo "$(GREEN)🔄 Reconstruction complète...$(NC)"
	@cd backend-django && $(MAKE) rebuild
	@echo "$(GREEN)✅ Reconstruction terminée !$(NC)"

status: ## Afficher le statut des services
	@echo "$(BLUE)📊 Statut des services Django :$(NC)"
	@cd backend-django && $(MAKE) status

##@ Backend Django (backend-django/)

# Rediriger les commandes vers le Makefile Django
migrate: ## Exécuter les migrations Django
	@cd backend-django && $(MAKE) migrate

migrations: ## Créer de nouvelles migrations
	@cd backend-django && $(MAKE) migrations

migrate-fresh: ## Reset et re-exécuter les migrations
	@cd backend-django && $(MAKE) migrate-fresh

superuser: ## Créer un superutilisateur
	@cd backend-django && $(MAKE) superuser

shell: ## Accéder au shell Django
	@cd backend-django && $(MAKE) shell

dbshell: ## Accéder au shell PostgreSQL
	@cd backend-django && $(MAKE) dbshell

collectstatic: ## Collecter les fichiers statiques
	@cd backend-django && $(MAKE) collectstatic

test: ## Exécuter les tests
	@cd backend-django && $(MAKE) test

lint: ## Vérification du code avec flake8
	@cd backend-django && $(MAKE) lint

format: ## Formatage du code avec black
	@cd backend-django && $(MAKE) format

logs-backend: ## Logs du backend Django
	@cd backend-django && $(MAKE) logs

logs-db: ## Logs PostgreSQL
	@cd backend-django && $(MAKE) logs-db

logs-redis: ## Logs Redis
	@cd backend-django && $(MAKE) logs-redis

##@ Frontend (frontend/)

npm-install: ## Installer les dépendances npm
	@echo "$(GREEN)📦 Installation des dépendances npm...$(NC)"
	@cd frontend && npm install

npm-build: ## Build du frontend
	@echo "$(GREEN)🔨 Build du frontend...$(NC)"
	@cd frontend && npm run build

npm-dev: ## Démarrer le mode développement
	@echo "$(GREEN)🚀 Démarrage du mode développement...$(NC)"
	@cd frontend && npm run dev

npm: ## Exécuter une commande npm
	@echo "$(BLUE)🔧 Exécution de npm $(cmd)...$(NC)"
	@cd frontend && npm $(cmd)

##@ Accès aux Containers

bash-backend: ## Accéder au terminal du backend Django
	@echo "$(BLUE)🔧 Accès au container backend Django...$(NC)"
	@cd backend-django && $(MAKE) shell

bash-frontend: ## Accéder au terminal du frontend
	@echo "$(BLUE)🔧 Accès au container frontend...$(NC)"
	@docker exec -it vtcbuilder_frontend /bin/sh

db-cli: ## Accéder à PostgreSQL CLI
	@echo "$(BLUE)🗄️  Accès à PostgreSQL...$(NC)"
	@cd backend-django && $(MAKE) dbshell

# Commandes Laravel supprimées - Projet migré vers Django

##@ Frontend (React/Next.js)

npm-install: ## Installer les dépendances npm
	@echo "$(GREEN)📦 Installation des dépendances npm...$(NC)"
	@docker exec $(FRONTEND_CONTAINER) npm install

npm-build: ## Build du frontend
	@echo "$(GREEN)🔨 Build du frontend...$(NC)"
	@docker exec $(FRONTEND_CONTAINER) npm run build

npm-dev: ## Démarrer le mode développement
	@docker exec $(FRONTEND_CONTAINER) npm run dev

npm: ## Exécuter une commande npm (ex: make npm cmd="run lint")
	@docker exec $(FRONTEND_CONTAINER) npm $(cmd)

##@ Tenants (Multi-tenant)

tenant-create: ## Créer un nouveau tenant (ex: make tenant-create name="client1")
	@echo "$(GREEN)🏢 Création d'un nouveau tenant...$(NC)"
	@docker exec $(BACKEND_CONTAINER) php artisan tenant:create $(name)

tenant-list: ## Lister tous les tenants
	@echo "$(BLUE)📋 Liste des tenants :$(NC)"
	@docker exec $(BACKEND_CONTAINER) php artisan tenant:list

tenant-migrate: ## Migrer les tenants
	@echo "$(GREEN)🗄️  Migration des tenants...$(NC)"
	@docker exec $(BACKEND_CONTAINER) php artisan tenants:migrate

tenant-seed: ## Seed des tenants
	@docker exec $(BACKEND_CONTAINER) php artisan tenants:seed

##@ Tests

test: ## Exécuter les tests
	@echo "$(GREEN)🧪 Exécution des tests...$(NC)"
	@docker exec $(BACKEND_CONTAINER) php artisan test

test-coverage: ## Tests avec couverture de code
	@docker exec $(BACKEND_CONTAINER) php artisan test --coverage

##@ Base de données

db-backup: ## Backup de la base de données
	@echo "$(GREEN)💾 Backup de la base de données...$(NC)"
	@mkdir -p ./backups
	@docker exec $(MYSQL_CONTAINER) mysqldump -u vtcbuilder_user -pvtcbuilder_password vtcbuilder > ./backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Backup créé dans ./backups/$(NC)"

db-restore: ## Restaurer la base (ex: make db-restore file="backup.sql")
	@echo "$(YELLOW)📥 Restauration de la base...$(NC)"
	@docker exec -i $(MYSQL_CONTAINER) mysql -u vtcbuilder_user -pvtcbuilder_password vtcbuilder < $(file)
	@echo "$(GREEN)✅ Base restaurée !$(NC)"

db-reset: ## Reset complet de la base
	@echo "$(RED)⚠️  Reset de la base de données...$(NC)"
	@docker exec $(MYSQL_CONTAINER) mysql -u vtcbuilder_user -pvtcbuilder_password -e "DROP DATABASE IF EXISTS vtcbuilder; CREATE DATABASE vtcbuilder;"
	@make migrate seed

##@ Nettoyage

clean: ## Nettoyer les containers et volumes
	@echo "$(RED)🧹 Nettoyage complet...$(NC)"
	@$(DOCKER_COMPOSE) down -v
	@docker system prune -f
	@echo "$(GREEN)✅ Nettoyage terminé !$(NC)"

clean-all: clean ## Nettoyage complet + suppression des images
	@docker rmi $(shell docker images -q vtcbuilder* 2>/dev/null) 2>/dev/null || true
	@echo "$(GREEN)✅ Nettoyage complet terminé !$(NC)"

reset: clean-all install start ## Reset complet du projet

##@ Production

prod-build: ## Build pour la production
	@echo "$(GREEN)🚀 Build production...$(NC)"
	@$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml build
	@echo "$(GREEN)✅ Build production terminé !$(NC)"

prod-up: ## Démarrer en mode production
	@echo "$(GREEN)🚀 Démarrage en production...$(NC)"
	@$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml up -d
	@echo "$(GREEN)✅ Production démarrée !$(NC)"

prod-deploy: prod-build prod-up migrate optimize ## Déploiement complet en production
	@echo "$(GREEN)✅ Déploiement production terminé !$(NC)"

##@ Utilitaires

fix-permissions: ## Corriger les permissions des fichiers
	@echo "$(YELLOW)🔧 Correction des permissions...$(NC)"
	@docker exec $(BACKEND_CONTAINER) chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
	@docker exec $(BACKEND_CONTAINER) chmod -R 775 /var/www/storage /var/www/bootstrap/cache
	@echo "$(GREEN)✅ Permissions corrigées !$(NC)"

update: ## Mettre à jour toutes les dépendances
	@echo "$(GREEN)📦 Mise à jour des dépendances...$(NC)"
	@make composer-update
	@docker exec $(FRONTEND_CONTAINER) npm update
	@echo "$(GREEN)✅ Dépendances mises à jour !$(NC)"

shell-mysql: ## Shell MySQL direct
	@docker exec -it $(MYSQL_CONTAINER) /bin/bash

urls: ## Afficher toutes les URLs du projet
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)🌐 URLs de l'application :$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "  $(YELLOW)Frontend:$(NC)          http://localhost:3000"
	@echo "  $(YELLOW)Backend API:$(NC)       http://localhost:8000"
	@echo "  $(YELLOW)PhpMyAdmin:$(NC)        http://localhost:8081"
	@echo "  $(YELLOW)Traefik Dashboard:$(NC) http://localhost:8080"
	@echo "  $(YELLOW)Redis Commander:$(NC)   http://localhost:8082"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"

info: ## Informations système Docker
	@echo "$(BLUE)ℹ️  Informations Docker :$(NC)"
	@docker --version
	@docker-compose --version
	@echo ""
	@echo "$(BLUE)💾 Utilisation disque :$(NC)"
	@docker system df

# Commande par défaut
.DEFAULT_GOAL := help

