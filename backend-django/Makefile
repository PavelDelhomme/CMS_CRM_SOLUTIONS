.PHONY: help install setup start stop restart build logs clean migrate superuser shell test lint format up

# Variables
DOCKER_COMPOSE = docker-compose -f ../docker-compose.simple.yml
BACKEND_CONTAINER = vtcbuilder_backend
POSTGRES_CONTAINER = vtcbuilder_postgres
COMPOSE_PROJECT_NAME = vtcbuilder_django

# Couleurs pour l'affichage
BLUE = \033[0;34m
GREEN = \033[0;32m
YELLOW = \033[0;33m
RED = \033[0;31m
NC = \033[0m # No Color

##@ Aide

help: ## Afficher l'aide
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo "$(GREEN)    Django Backend - Commandes disponibles$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@awk 'BEGIN {FS = ":.*##"; printf "\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@echo ""

##@ Installation et Configuration

install: ## Installation du backend Django
	@echo "$(GREEN)📦 Installation du backend Django...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)⚙️  Création du fichier .env...$(NC)"; \
		echo "SECRET_KEY=django-insecure-change-this-in-production" > .env; \
		echo "DEBUG=True" >> .env; \
		echo "DB_NAME=vtcbuilder" >> .env; \
		echo "DB_USER=vtcbuilder_user" >> .env; \
		echo "DB_PASSWORD=vtcbuilder_password" >> .env; \
		echo "DB_HOST=postgres" >> .env; \
		echo "DB_PORT=5432" >> .env; \
		echo "REDIS_URL=redis://redis:6379/0" >> .env; \
		echo "ALLOWED_HOSTS=localhost,127.0.0.1,api.localhost,backend" >> .env; \
	fi
	@echo "$(GREEN)🐳 Construction des images Docker...$(NC)"
	@$(DOCKER_COMPOSE) build backend
	@echo "$(GREEN)✅ Installation terminée !$(NC)"

setup: install migrate setup-permissions ## Installation complète avec migrations et permissions
	@echo "$(GREEN)✨ Configuration Django terminée !$(NC)"
	@echo "$(BLUE)💡 Pour créer un tenant de démonstration, utilisez:$(NC)"
	@echo "$(YELLOW)   make demo-tenant$(NC)"

setup-permissions: ## Configurer les permissions et rôles
	@echo "$(GREEN)🔐 Configuration des permissions...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py setup_permissions --super-admin
	@echo "$(GREEN)✅ Permissions configurées !$(NC)"

load-fixtures: ## Charger les données de démonstration
	@echo "$(GREEN)📦 Chargement des données de test...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py loaddata tenants/fixtures/sample_data.json
	@echo "$(GREEN)✅ Données de test chargées !$(NC)"

demo-tenant: ## Créer un tenant de démonstration
	@echo "$(GREEN)🏢 Création d'un tenant de démonstration...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@./create-demo-simple.sh

##@ Gestion des Services

start: ## Démarrer les services Django
	@echo "$(GREEN)🚀 Démarrage des services Django...$(NC)"
	@./start.sh

up: ## Démarrer les services Django
	@echo "$(GREEN)🚀 Démarrage des services Django...$(NC)"
	@./start.sh

stop: ## Arrêter tous les services
	@echo "$(YELLOW)⏸️  Arrêt des services...$(NC)"
	@$(DOCKER_COMPOSE) stop
	@echo "$(GREEN)✅ Services arrêtés !$(NC)"

restart: stop start ## Redémarrer tous les services

down: ## Arrêter et supprimer les containers
	@echo "$(RED)🗑️  Suppression des containers...$(NC)"
	@$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✅ Containers supprimés !$(NC)"

build: ## Reconstruire les images Docker
	@echo "$(GREEN)🔨 Reconstruction des images...$(NC)"
	@$(DOCKER_COMPOSE) build --no-cache backend
	@echo "$(GREEN)✅ Images reconstruites !$(NC)"

##@ Base de données

migrate: ## Exécuter les migrations Django
	@echo "$(GREEN)🗄️  Exécution des migrations...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis
	@echo "$(BLUE)⏳ Attente du démarrage de PostgreSQL...$(NC)"
	@sleep 10
	@$(DOCKER_COMPOSE) up -d backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py migrate
	@echo "$(GREEN)✅ Migrations exécutées !$(NC)"

migrations: ## Créer de nouvelles migrations
	@echo "$(GREEN)📄 Génération des migrations...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py makemigrations
	@echo "$(GREEN)✅ Migrations générées !$(NC)"

migrate-fresh: ## Reset et re-exécuter les migrations
	@echo "$(RED)⚠️  Reset de la base de données...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py migrate --fake-initial
	@echo "$(GREEN)✅ Base remise à zéro !$(NC)"

superuser: ## Créer un superutilisateur
	@echo "$(GREEN)👤 Création d'un superutilisateur...$(NC)"
	@echo "$(YELLOW)Informations requises:$(NC)"
	@echo "  Email: admin@vtcbuilder.com"
	@echo "  Password: admin123"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec -it $(BACKEND_CONTAINER) python manage.py createsuperuser --noinput --email admin@vtcbuilder.com || \
	 docker exec $(BACKEND_CONTAINER) python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(email='admin@vtcbuilder.com').delete(); User.objects.create_superuser('admin@vtcbuilder.com', 'admin@vtcbuilder.com', 'admin123')"
	@echo "$(GREEN)✅ Superutilisateur créé !$(NC)"

##@ Développement

shell: ## Accéder au shell Django
	@echo "$(BLUE)🐚 Accès au shell Django...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec -it $(BACKEND_CONTAINER) python manage.py shell

dbshell: ## Accéder au shell PostgreSQL
	@echo "$(BLUE)🗄️  Accès à PostgreSQL...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres
	@docker exec -it $(POSTGRES_CONTAINER) psql -U vtcbuilder_user vtcbuilder

collectstatic: ## Collecter les fichiers statiques
	@echo "$(GREEN)📁 Collecte des fichiers statiques...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py collectstatic --noinput
	@echo "$(GREEN)✅ Fichiers statiques collectés !$(NC)"

##@ Tests et qualité

test: ## Exécuter les tests
	@echo "$(GREEN)🧪 Exécution des tests...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py test
	@echo "$(GREEN)✅ Tests terminés !$(NC)"

lint: ## Vérification du code avec flake8
	@echo "$(BLUE)🔍 Vérification du code...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) flake8 .
	@echo "$(GREEN)✅ Vérification terminée !$(NC)"

format: ## Formatage du code avec black
	@echo "$(BLUE)🎨 Formatage du code...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) black .
	@echo "$(GREEN)✅ Code formaté !$(NC)"

##@ Logs

logs: ## Afficher tous les logs
	@$(DOCKER_COMPOSE) logs -f backend

logs-db: ## Logs PostgreSQL
	@$(DOCKER_COMPOSE) logs -f postgres

logs-redis: ## Logs Redis
	@$(DOCKER_COMPOSE) logs -f redis

##@ Utilitaires

clean: ## Nettoyer les fichiers temporaires
	@echo "$(YELLOW)🧹 Nettoyage...$(NC)"
	@find . -type f -name "*.pyc" -delete
	@find . -type d -name "__pycache__" -delete
	@find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	@echo "$(GREEN)✅ Nettoyage terminé !$(NC)"

reset: clean migrate ## Reset des données
	@echo "$(GREEN)🔄 Reset terminé !$(NC)"

status: ## Statut des services
	@$(DOCKER_COMPOSE) ps

##@ URLs

urls: ## Afficher les URLs importantes
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)🌐 URLs CMS CRM Solutions :$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "  $(YELLOW)Frontend:$(NC)           http://localhost:3004"
	@echo "  $(YELLOW)API Django:$(NC)         http://localhost:8088/api/"
	@echo "  $(YELLOW)Admin Django:$(NC)      http://localhost:8088/admin/"
	@echo "  $(YELLOW)PgAdmin:$(NC)           http://localhost:8084"
	@echo "  $(YELLOW)PostgreSQL:$(NC)        localhost:5434"
	@echo "  $(YELLOW)Redis:$(NC)             localhost:6381"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"

.DEFAULT_GOAL := help
