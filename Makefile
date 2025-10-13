.PHONY: help install start stop restart build logs clean migrate seed fresh test bash-backend bash-frontend db-cli composer npm artisan

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
	@echo "$(GREEN)    VTCBuilder - Commandes disponibles$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@awk 'BEGIN {FS = ":.*##"; printf "\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@echo ""

##@ Installation et Configuration

install: ## Installation complète du projet
	@echo "$(GREEN)📦 Installation du projet VTCBuilder...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)⚙️  Création du fichier .env...$(NC)"; \
		cp .env.example .env 2>/dev/null || echo "APP_NAME=VTCBuilder" > .env; \
	fi
	@echo "$(GREEN)🐳 Construction des images Docker...$(NC)"
	@$(DOCKER_COMPOSE) build
	@echo "$(GREEN)✅ Installation terminée !$(NC)"
	@echo "$(BLUE)Utilisez 'make start' pour démarrer le projet$(NC)"

setup: install start composer-install migrate seed ## Installation et configuration complète avec données de test
	@echo "$(GREEN)✨ Configuration complète terminée !$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)🚀 Application disponible :$(NC)"
	@echo "   Frontend: http://localhost:3000"
	@echo "   API: http://localhost:8000"
	@echo "   PhpMyAdmin: http://localhost:8081"
	@echo "   Traefik Dashboard: http://localhost:8080"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"

##@ Gestion des Containers

start: ## Démarrer tous les services
	@echo "$(GREEN)🚀 Démarrage des services...$(NC)"
	@$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✅ Services démarrés !$(NC)"
	@make status

stop: ## Arrêter tous les services
	@echo "$(YELLOW)⏸️  Arrêt des services...$(NC)"
	@$(DOCKER_COMPOSE) stop
	@echo "$(GREEN)✅ Services arrêtés !$(NC)"

restart: stop start ## Redémarrer tous les services

down: ## Arrêter et supprimer tous les containers
	@echo "$(RED)🗑️  Suppression des containers...$(NC)"
	@$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✅ Containers supprimés !$(NC)"

build: ## Reconstruire les images Docker
	@echo "$(GREEN)🔨 Reconstruction des images...$(NC)"
	@$(DOCKER_COMPOSE) build --no-cache
	@echo "$(GREEN)✅ Images reconstruites !$(NC)"

rebuild: down build start ## Tout reconstruire et redémarrer

status: ## Afficher le statut des services
	@echo "$(BLUE)📊 Statut des services :$(NC)"
	@$(DOCKER_COMPOSE) ps

##@ Logs et Monitoring

logs: ## Afficher tous les logs
	@$(DOCKER_COMPOSE) logs -f

logs-backend: ## Logs du backend Laravel
	@$(DOCKER_COMPOSE) logs -f backend nginx

logs-frontend: ## Logs du frontend React
	@$(DOCKER_COMPOSE) logs -f frontend

logs-db: ## Logs de la base de données
	@$(DOCKER_COMPOSE) logs -f mysql

logs-redis: ## Logs Redis
	@$(DOCKER_COMPOSE) logs -f redis

##@ Accès aux Containers

bash-backend: ## Accéder au terminal du backend
	@echo "$(BLUE)🔧 Accès au container backend...$(NC)"
	@docker exec -it $(BACKEND_CONTAINER) /bin/bash

bash-frontend: ## Accéder au terminal du frontend
	@echo "$(BLUE)🔧 Accès au container frontend...$(NC)"
	@docker exec -it $(FRONTEND_CONTAINER) /bin/sh

bash-nginx: ## Accéder au terminal Nginx
	@docker exec -it $(NGINX_CONTAINER) /bin/sh

db-cli: ## Accéder à MySQL CLI
	@echo "$(BLUE)🗄️  Accès à MySQL...$(NC)"
	@docker exec -it $(MYSQL_CONTAINER) mysql -u vtcbuilder_user -pvtcbuilder_password vtcbuilder

##@ Backend (Laravel)

composer-install: ## Installer les dépendances Composer
	@echo "$(GREEN)📦 Installation des dépendances Composer...$(NC)"
	@docker exec $(BACKEND_CONTAINER) composer install --no-interaction --prefer-dist --optimize-autoloader

composer-update: ## Mettre à jour les dépendances Composer
	@docker exec $(BACKEND_CONTAINER) composer update

artisan: ## Exécuter une commande artisan (ex: make artisan cmd="migrate")
	@docker exec $(BACKEND_CONTAINER) php artisan $(cmd)

key-generate: ## Générer la clé d'application Laravel
	@echo "$(GREEN)🔑 Génération de la clé d'application...$(NC)"
	@docker exec $(BACKEND_CONTAINER) php artisan key:generate

migrate: ## Exécuter les migrations
	@echo "$(GREEN)🗄️  Exécution des migrations...$(NC)"
	@docker exec $(BACKEND_CONTAINER) php artisan migrate --force

migrate-fresh: ## Reset et re-exécuter les migrations
	@echo "$(RED)⚠️  Reset de la base de données...$(NC)"
	@docker exec $(BACKEND_CONTAINER) php artisan migrate:fresh --force

migrate-rollback: ## Rollback de la dernière migration
	@docker exec $(BACKEND_CONTAINER) php artisan migrate:rollback

seed: ## Exécuter les seeders
	@echo "$(GREEN)🌱 Exécution des seeders...$(NC)"
	@docker exec $(BACKEND_CONTAINER) php artisan db:seed

fresh: migrate-fresh seed ## Reset DB + migrations + seeders

optimize: ## Optimiser Laravel (cache config, routes, views)
	@echo "$(GREEN)⚡ Optimisation de Laravel...$(NC)"
	@docker exec $(BACKEND_CONTAINER) php artisan optimize
	@docker exec $(BACKEND_CONTAINER) php artisan config:cache
	@docker exec $(BACKEND_CONTAINER) php artisan route:cache
	@docker exec $(BACKEND_CONTAINER) php artisan view:cache

clear-cache: ## Nettoyer tous les caches Laravel
	@echo "$(YELLOW)🧹 Nettoyage des caches...$(NC)"
	@docker exec $(BACKEND_CONTAINER) php artisan cache:clear
	@docker exec $(BACKEND_CONTAINER) php artisan config:clear
	@docker exec $(BACKEND_CONTAINER) php artisan route:clear
	@docker exec $(BACKEND_CONTAINER) php artisan view:clear

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

