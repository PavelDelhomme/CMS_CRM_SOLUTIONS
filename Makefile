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
	@echo "$(BLUE)Utilisez 'make setup-backend-django' pour la configuration complète$(NC)"

setup: setup-backend-django ## Alias pour setup-backend-django

setup-backend-django: ## Installation et configuration complète du backend Django
	@echo "$(GREEN)✨ Configuration complète Django...$(NC)"
	@echo "$(YELLOW)📦 Installation du backend Django...$(NC)"
	@cd backend-django && $(MAKE) install
	@echo "$(YELLOW)🗄️  Configuration des migrations...$(NC)"
	@cd backend-django && $(MAKE) migrate
	@echo "$(YELLOW)🔐 Configuration des permissions...$(NC)"
	@cd backend-django && $(MAKE) setup-permissions
	@echo "$(GREEN)✅ Configuration terminée !$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)🚀 Application prête ! Utilisez 'make start' pour démarrer$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)📍 URLs disponibles après démarrage :$(NC)"
	@echo "   Frontend:     http://localhost:9494"
	@echo "   API Django:   http://localhost:9495/api/"
	@echo "   Admin Django: http://localhost:9495/admin/"
	@echo "   PgAdmin:      http://localhost:9498"
	@echo "   PostgreSQL:   localhost:9496"
	@echo "   Redis:        localhost:9497"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)🔐 Compte Super Admin :$(NC)"
	@echo "   Email:    admin@vtcbuilder.com"
	@echo "   Password: admin123"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"

quick-start: setup-backend-django start ## Configuration complète + démarrage en une commande
	@echo "$(GREEN)🎉 Tout est prêt et démarré !$(NC)"

##@ Gestion des Containers

start: ## Démarrer tous les services
	@echo "$(GREEN)🚀 Démarrage des services Django...$(NC)"
	@cd backend-django && $(MAKE) start
	@echo "$(GREEN)✅ Services démarrés !$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)📍 URLs d'accès :$(NC)"
	@echo "   Frontend:     http://localhost:9494"
	@echo "   API Django:   http://localhost:9495/api/"
	@echo "   Admin Django: http://localhost:9495/admin/"
	@echo "   PgAdmin:      http://localhost:9498"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)💡 Utilisez 'make logs' pour voir les logs$(NC)"
	@echo "$(GREEN)💡 Utilisez 'make status' pour vérifier le statut$(NC)"

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

status: ## Afficher le statut des services VTCBuilder
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)📊 Statut des conteneurs VTCBuilder :$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@docker ps --filter "name=vtcbuilder" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || true
	@echo ""
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)📈 Résumé :$(NC)"
	@RUNNING=$$(docker ps --filter "name=vtcbuilder" --format "{{.Names}}" | wc -l); \
	 STOPPED=$$(docker ps -a --filter "name=vtcbuilder" --filter "status=exited" --format "{{.Names}}" | wc -l); \
	 echo "  $(GREEN)●$(NC) En cours d'exécution : $$RUNNING"; \
	 if [ $$STOPPED -gt 0 ]; then echo "  $(RED)●$(NC) Arrêtés : $$STOPPED"; fi
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"

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

test: test-backend test-frontend ## Exécuter tous les tests (backend + frontend)
	@echo "$(GREEN)✅ Tous les tests terminés !$(NC)"

test-backend: ## Exécuter les tests backend
	@echo "$(GREEN)🧪 Exécution des tests backend...$(NC)"
	@cd backend-django && $(MAKE) test
	@echo "$(GREEN)✅ Tests backend terminés !$(NC)"

test-frontend: ## Exécuter les tests frontend
	@echo "$(GREEN)🧪 Exécution des tests frontend...$(NC)"
	@cd frontend && npm test -- --passWithNoTests
	@echo "$(GREEN)✅ Tests frontend terminés !$(NC)"

test-coverage: ## Exécuter les tests avec couverture de code
	@echo "$(GREEN)📊 Exécution des tests avec couverture...$(NC)"
	@cd backend-django && $(MAKE) test-coverage
	@cd frontend && npm test -- --coverage --passWithNoTests
	@echo "$(GREEN)✅ Rapports de couverture générés !$(NC)"

lint: ## Vérification du code avec flake8
	@cd backend-django && $(MAKE) lint

format: ## Formatage du code avec black
	@cd backend-django && $(MAKE) format

demo-tenant: ## Créer un tenant de démonstration
	@cd backend-django && $(MAKE) demo-tenant

logs: logs-backend ## Voir tous les logs (alias pour logs-backend)

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

npm-test: ## Tester le frontend (unitaires)
	@echo "$(GREEN)🧪 Tests unitaires du frontend...$(NC)"
	@cd frontend && npm test -- --passWithNoTests
	@echo "$(GREEN)✅ Tests frontend terminés$(NC)"

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

# Commandes Laravel obsolètes supprimées - Projet migré vers Django

urls: ## Afficher toutes les URLs du projet
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)🌐 URLs de l'application VTCBuilder :$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "  $(YELLOW)Frontend Next.js:$(NC)  http://localhost:9494"
	@echo "  $(YELLOW)Backend API:$(NC)        http://localhost:9495/api/"
	@echo "  $(YELLOW)Admin Django:$(NC)       http://localhost:9495/admin/"
	@echo "  $(YELLOW)PgAdmin:$(NC)            http://localhost:9498"
	@echo "  $(YELLOW)PostgreSQL:$(NC)         localhost:9496"
	@echo "  $(YELLOW)Redis:$(NC)              localhost:9497"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)🔐 Comptes de test :$(NC)"
	@echo "  $(YELLOW)Super Admin:$(NC)        admin@vtcbuilder.com / admin123"
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

