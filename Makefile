.PHONY: help setup start up stop down restart logs clean test lint format migrate shell status

# Variables
COMPOSE_FILE=docker-compose.yml
BACKEND_DIR=backend-django
FRONTEND_DIR=frontend

help: ## Affiche l'aide
	@echo "CMS_CRM_SOLUTIONS - Commandes disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

status: ## Affiche le statut détaillé des services
	@./scripts/status.sh

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
	@if [ ! -f .env ]; then \
		echo "⚠️  Fichier .env non trouvé, création depuis env.example..."; \
		cp env.example .env; \
		echo "✅ Fichier .env créé - Veuillez le configurer si nécessaire"; \
	fi
	docker-compose -f $(COMPOSE_FILE) up -d --remove-orphans
	@echo "✅ Services démarrés"
	@echo "🌐 Frontend: http://localhost:9194"
	@echo "🔧 API: http://localhost:9193/api"
	@echo "⚙️  Admin: http://localhost:9193/admin"
	@echo "🗄️  PostgreSQL: localhost:9191"
	@echo "📦 Redis: localhost:9192"

up: start ## Alias pour start (démarre tous les services)

stop: ## Arrête tous les services
	docker-compose -f $(COMPOSE_FILE) down

down: stop ## Alias pour stop (arrête tous les services)

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

# Global commands (backend + frontend)
test: ## Lance tous les tests (backend + frontend)
	@echo "🧪 Lancement des tests..."
	@echo ""
	@echo "📦 Tests Backend (via Docker)..."
	@BACKEND_TEST_STATUS=0; \
	if docker-compose -f $(COMPOSE_FILE) ps backend 2>/dev/null | grep -q "Up"; then \
		docker-compose -f $(COMPOSE_FILE) exec -T backend pytest || BACKEND_TEST_STATUS=1; \
	elif docker-compose -f $(COMPOSE_FILE) run --rm --no-deps backend pytest 2>/dev/null; then \
		true; \
	else \
		echo "⚠️  Backend non disponible dans Docker, tentative locale..."; \
		cd $(BACKEND_DIR) && (make test || BACKEND_TEST_STATUS=1) || true; \
	fi; \
	if [ "$$BACKEND_TEST_STATUS" != "0" ]; then \
		echo "❌ Tests backend échoués"; \
	fi
	@echo ""
	@echo "🎨 Tests Frontend (TypeScript check)..."
	@FRONTEND_TEST_STATUS=0; \
	if docker-compose -f $(COMPOSE_FILE) ps frontend 2>/dev/null | grep -q "Up"; then \
		docker-compose -f $(COMPOSE_FILE) exec -T frontend npm run type-check || FRONTEND_TEST_STATUS=1; \
	elif docker-compose -f $(COMPOSE_FILE) run --rm --no-deps frontend npm run type-check 2>/dev/null; then \
		true; \
	elif [ -d "$(FRONTEND_DIR)/node_modules" ]; then \
		cd $(FRONTEND_DIR) && (npm run type-check || FRONTEND_TEST_STATUS=1) || true; \
	else \
		echo "⚠️  Frontend non disponible, installation des dépendances..."; \
		cd $(FRONTEND_DIR) && npm install && npm run type-check || FRONTEND_TEST_STATUS=1; \
	fi; \
	if [ "$$FRONTEND_TEST_STATUS" != "0" ]; then \
		echo "❌ Vérification TypeScript échouée"; \
	fi
	@echo ""
	@if [ "$$BACKEND_TEST_STATUS" = "0" ] && [ "$$FRONTEND_TEST_STATUS" = "0" ]; then \
		echo "✅ Tous les tests sont passés!"; \
	else \
		echo "❌ Certains tests ont échoué (voir ci-dessus)"; \
		exit 1; \
	fi

lint: ## Vérifie le code (backend + frontend)
	@echo "🔍 Vérification du code..."
	@echo ""
	@echo "📦 Lint Backend (via Docker)..."
	@BACKEND_LINT_STATUS=0; \
	if docker-compose -f $(COMPOSE_FILE) ps backend 2>/dev/null | grep -q "Up"; then \
		docker-compose -f $(COMPOSE_FILE) exec -T backend flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics 2>&1 || BACKEND_LINT_STATUS=1; \
		docker-compose -f $(COMPOSE_FILE) exec -T backend flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics 2>&1 || true; \
	elif docker-compose -f $(COMPOSE_FILE) run --rm --no-deps backend sh -c "flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics && flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics" 2>&1; then \
		true; \
	else \
		echo "⚠️  Backend non disponible dans Docker, tentative locale..."; \
		cd $(BACKEND_DIR) && (make lint || BACKEND_LINT_STATUS=1) || true; \
	fi; \
	if [ "$$BACKEND_LINT_STATUS" != "0" ]; then \
		echo "⚠️  Le lint backend a trouvé des erreurs (voir ci-dessus)"; \
	fi
	@echo ""
	@echo "🎨 Lint Frontend..."
	@FRONTEND_LINT_STATUS=0; \
	if docker-compose -f $(COMPOSE_FILE) ps frontend 2>/dev/null | grep -q "Up"; then \
		docker-compose -f $(COMPOSE_FILE) exec -T frontend npm run lint || FRONTEND_LINT_STATUS=1; \
	elif docker-compose -f $(COMPOSE_FILE) run --rm --no-deps frontend npm run lint 2>/dev/null; then \
		true; \
	elif [ -d "$(FRONTEND_DIR)/node_modules" ]; then \
		cd $(FRONTEND_DIR) && (npm run lint || FRONTEND_LINT_STATUS=1) || true; \
	else \
		echo "⚠️  Frontend non disponible, installation des dépendances..."; \
		cd $(FRONTEND_DIR) && npm install && npm run lint || FRONTEND_LINT_STATUS=1; \
	fi; \
	if [ "$$FRONTEND_LINT_STATUS" != "0" ]; then \
		echo "⚠️  Le lint frontend a trouvé des erreurs (voir ci-dessus)"; \
	fi
	@echo ""
	@if [ "$$BACKEND_LINT_STATUS" = "0" ] && [ "$$FRONTEND_LINT_STATUS" = "0" ]; then \
		echo "✅ Tous les lints sont passés!"; \
	else \
		echo "⚠️  Certains lints ont trouvé des problèmes (voir ci-dessus)"; \
		exit 1; \
	fi

format: ## Formate le code (backend + frontend)
	@echo "✨ Formatage du code..."
	@echo ""
	@echo "📦 Format Backend (via Docker)..."
	@docker-compose -f $(COMPOSE_FILE) exec -T backend black . || \
		(docker-compose -f $(COMPOSE_FILE) run --rm backend black . || \
		(echo "⚠️  Backend non disponible dans Docker, tentative locale..." && \
		 cd $(BACKEND_DIR) && make format))
	@echo ""
	@echo "🎨 Format Frontend (vérification)..."
	@cd $(FRONTEND_DIR) && npm run lint -- --fix || echo "⚠️  Certains fichiers frontend n'ont pas pu être formatés automatiquement"
	@echo ""
	@echo "✅ Formatage terminé!"

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

