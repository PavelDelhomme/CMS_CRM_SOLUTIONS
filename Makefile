.PHONY: help setup start stop restart logs clean test migrate shell

# Variables
COMPOSE_FILE=docker-compose.yml
BACKEND_DIR=backend-django
FRONTEND_DIR=frontend

help: ## Affiche l'aide
	@echo "CMS_CRM_SOLUTIONS - Commandes disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Installation complète du projet
	@echo "🚀 Installation de CMS_CRM_SOLUTIONS..."
	@if [ ! -f .env ]; then \
		cp env.example .env; \
		echo "📝 Fichier .env créé - Veuillez le configurer"; \
	fi
	@cd $(BACKEND_DIR) && make setup
	@cd $(FRONTEND_DIR) && npm install
	@echo "✅ Installation terminée!"

start: ## Démarre tous les services
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "✅ Services démarrés"
	@echo "🌐 Frontend: http://localhost:9494"
	@echo "🔧 API: http://localhost:9495/api"
	@echo "⚙️  Admin: http://localhost:9495/admin"

stop: ## Arrête tous les services
	docker-compose -f $(COMPOSE_FILE) down

restart: stop start ## Redémarre tous les services

logs: ## Affiche les logs de tous les services
	docker-compose -f $(COMPOSE_FILE) logs -f

logs-backend: ## Logs du backend uniquement
	docker-compose -f $(COMPOSE_FILE) logs -f backend

logs-frontend: ## Logs du frontend uniquement
	docker-compose -f $(COMPOSE_FILE) logs -f frontend

logs-db: ## Logs de la base de données
	docker-compose -f $(COMPOSE_FILE) logs -f db

clean: ## Nettoie les conteneurs et volumes
	docker-compose -f $(COMPOSE_FILE) down -v
	docker system prune -f

# Backend commands
backend-shell: ## Ouvre un shell Django
	cd $(BACKEND_DIR) && make shell

backend-migrate: ## Applique les migrations
	cd $(BACKEND_DIR) && make migrate

backend-migrations: ## Crée de nouvelles migrations
	cd $(BACKEND_DIR) && make migrations

backend-test: ## Lance les tests backend
	cd $(BACKEND_DIR) && make test

backend-lint: ## Vérifie le code backend
	cd $(BACKEND_DIR) && make lint

backend-format: ## Formate le code backend
	cd $(BACKEND_DIR) && make format

# Frontend commands
frontend-dev: ## Démarre le frontend en mode développement
	cd $(FRONTEND_DIR) && npm run dev

frontend-build: ## Build le frontend
	cd $(FRONTEND_DIR) && npm run build

frontend-lint: ## Vérifie le code frontend
	cd $(FRONTEND_DIR) && npm run lint

# Database commands
db-shell: ## Ouvre un shell PostgreSQL
	docker-compose -f $(COMPOSE_FILE) exec db psql -U postgres -d cms_crm_solutions

db-backup: ## Sauvegarde la base de données
	@mkdir -p backups
	docker-compose -f $(COMPOSE_FILE) exec -T db pg_dump -U postgres cms_crm_solutions > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Sauvegarde créée dans backups/"

db-restore: ## Restaure la base de données (usage: make db-restore FILE=backups/backup.sql)
	@if [ -z "$(FILE)" ]; then \
		echo "❌ Usage: make db-restore FILE=backups/backup.sql"; \
		exit 1; \
	fi
	docker-compose -f $(COMPOSE_FILE) exec -T db psql -U postgres cms_crm_solutions < $(FILE)
	@echo "✅ Base de données restaurée"

# Demo commands
demo-tenant: ## Crée un tenant de démonstration
	cd $(BACKEND_DIR) && python manage.py create_demo_tenant

superuser: ## Crée un super utilisateur
	cd $(BACKEND_DIR) && python manage.py createsuperuser

# Development
dev: ## Démarre en mode développement (sans Docker)
	@echo "🚀 Mode développement..."
	@echo "Backend: cd $(BACKEND_DIR) && make dev"
	@echo "Frontend: cd $(FRONTEND_DIR) && npm run dev"

# Production
prod-build: ## Build pour la production
	docker-compose -f docker-compose.prod.yml build

prod-start: ## Démarre en production
	docker-compose -f docker-compose.prod.yml up -d

prod-stop: ## Arrête la production
	docker-compose -f docker-compose.prod.yml down

