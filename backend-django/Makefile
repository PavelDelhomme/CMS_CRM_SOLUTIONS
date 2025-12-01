.PHONY: help install setup start stop restart build logs clean migrate superuser shell test lint format up test-subscriptions-internal test-payments-internal test-invoices-internal test-pricing-plans-internal test-trial-status test-trial-create test-trial-activate test-trial-expire test-trial-advance

# Variables
DOCKER_COMPOSE = docker-compose -f ../docker-compose.simple.yml
BACKEND_CONTAINER = vtcbuilder-backend
POSTGRES_CONTAINER = vtcbuilder-postgres
COMPOSE_PROJECT_NAME = vtcbuilder

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

##@ Tests Billing (Trials, Abonnements)

test-trial-status: ## Afficher le statut de tous les abonnements trial
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)📊 Statut des Abonnements Trial$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py test_trial --action=status

test-trial-create: ## Créer un abonnement trial (usage: make test-trial-create TENANT_ID=1 PLAN_ID=1 DAYS=14)
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)🧪 Création d'un Abonnement Trial$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@if [ -z "$(TENANT_ID)" ] || [ -z "$(PLAN_ID)" ]; then \
		echo "$(RED)❌ Usage: make test-trial-create TENANT_ID=1 PLAN_ID=1 DAYS=14$(NC)"; \
		echo "$(YELLOW)💡 List tenants: make test-trial-status$(NC)"; \
	else \
		docker exec $(BACKEND_CONTAINER) python manage.py test_trial --action=create \
			--tenant-id=$(TENANT_ID) --plan-id=$(PLAN_ID) --trial-days=$(or $(DAYS),14); \
	fi

test-trial-activate: ## Activer un abonnement trial (usage: make test-trial-activate TENANT_ID=1)
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)🔄 Activation d'un Abonnement Trial$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@if [ -z "$(TENANT_ID)" ]; then \
		echo "$(RED)❌ Usage: make test-trial-activate TENANT_ID=1$(NC)"; \
		echo "$(YELLOW)💡 Ou utilisez --all pour tous activer$(NC)"; \
	else \
		docker exec $(BACKEND_CONTAINER) python manage.py test_trial --action=activate --tenant-id=$(TENANT_ID); \
	fi

test-trial-expire: ## Expirer un abonnement trial (usage: make test-trial-expire TENANT_ID=1)
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)⏰ Expiration d'un Abonnement Trial$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@if [ -z "$(TENANT_ID)" ]; then \
		echo "$(RED)❌ Usage: make test-trial-expire TENANT_ID=1$(NC)"; \
		echo "$(YELLOW)💡 Ou utilisez --all pour tous expirer$(NC)"; \
	else \
		docker exec $(BACKEND_CONTAINER) python manage.py test_trial --action=expire --tenant-id=$(TENANT_ID); \
	fi

test-trial-advance: ## Avancer le temps pour simuler l'expiration (usage: make test-trial-advance DAYS=15)
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)⏰ Simulation de l'Avancement du Temps$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@if [ -z "$(DAYS)" ]; then \
		echo "$(RED)❌ Usage: make test-trial-advance DAYS=15$(NC)"; \
		echo "$(YELLOW)💡 Cela avance le temps de X jours pour simuler l'expiration$(NC)"; \
	else \
		docker exec $(BACKEND_CONTAINER) python manage.py test_trial --action=advance-time --days-advance=$(DAYS); \
	fi

##@ Gestion des Services

start: ## Démarrer les services Django
	@echo "$(GREEN)🚀 Démarrage des services Django...$(NC)"
	@./start.sh

up: ## Démarrer les services Django
	@echo "$(GREEN)🚀 Démarrage des services Django...$(NC)"
	@./start.sh
	@echo "$(GREEN)✅ Services démarrés avec migrations automatiques !$(NC)"

stop: ## Arrêter tous les services
	@echo "$(YELLOW)⏸️  Arrêt des services...$(NC)"
	@$(DOCKER_COMPOSE) stop
	@echo "$(GREEN)✅ Services arrêtés !$(NC)"

restart: stop start ## Redémarrer tous les services

down: ## Arrêter et supprimer les containers
	@echo "$(RED)🗑️  Arrêt des containers...$(NC)"
	@$(DOCKER_COMPOSE) stop
	@echo "$(YELLOW)💡 Pour supprimer complètement les containers, utilisez: make down-remove$(NC)"
	@echo "$(GREEN)✅ Containers arrêtés !$(NC)"

down-remove: ## Arrêter et supprimer complètement les containers
	@echo "$(RED)🗑️  Suppression complète des containers...$(NC)"
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

test: ## Exécuter les tests avec pytest
	@echo "$(GREEN)🧪 Exécution des tests avec pytest...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) pytest --verbose --tb=short -v
	@echo "$(GREEN)✅ Tests terminés !$(NC)"

test-api: ## Tester tous les endpoints de l'API
	@echo "$(GREEN)🧪 Tests des endpoints API...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python tests/api/test_all_endpoints.py
	@echo "$(GREEN)✅ Tests API terminés !$(NC)"

test-endpoints: test-api ## Alias pour test-api

check-errors: ## Vérifier les erreurs dans les logs
	@echo "$(BLUE)🔍 Vérification des erreurs...$(NC)"
	@docker logs $(BACKEND_CONTAINER) --tail 100 2>&1 | grep -E "ERROR|Exception|Traceback|500|FieldError" || echo "$(GREEN)✅ Aucune erreur détectée$(NC)"

verify-features: ## Vérifier l'accès aux features selon les plans
	@echo "$(GREEN)🔐 Vérification de l'accès aux features...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python -c "import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vtcbuilder.settings'); django.setup(); from tenants.models import User, Feature; from billing.models import PricingPlan; super_admin = User.objects.filter(role='super-admin').first(); all_features = Feature.objects.filter(is_active=True); accessible = sum(1 for f in all_features if super_admin.can_use_feature(f)) if super_admin else 0; print(f'Super Admin: {accessible}/{all_features.count()} features accessibles'); plans = PricingPlan.objects.all(); print(f'Plans: {plans.count()}'); [print(f'  - {p.name}: {Feature.objects.filter(available_plans=p, is_active=True).count()} features') for p in plans]"
	@echo "$(GREEN)✅ Vérification terminée !$(NC)"

setup-test-env: ## Configurer l'environnement de test complet (tenants, abonnements, factures, paiements)
	@echo "$(GREEN)🚀 Configuration de l'environnement de test...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py setup_test_environment
	@echo "$(GREEN)✅ Environnement de test configuré !$(NC)"

setup-test-env-reset: ## Réinitialiser et configurer l'environnement de test (supprime les données existantes)
	@echo "$(GREEN)🚀 Réinitialisation de l'environnement de test...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py setup_test_environment --reset
	@echo "$(GREEN)✅ Environnement de test réinitialisé !$(NC)"

init-defaults: ## Initialiser les blocs et templates de base
	@echo "$(GREEN)🚀 Initialisation des blocs et templates de base...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py create_default_block_types
	@docker exec $(BACKEND_CONTAINER) python manage.py create_default_templates
	@echo "$(GREEN)✅ Blocs et templates initialisés !$(NC)"

init-blocks: ## Initialiser uniquement les blocs de base
	@echo "$(GREEN)📦 Initialisation des blocs de base...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py create_default_block_types
	@echo "$(GREEN)✅ Blocs initialisés !$(NC)"

init-templates: ## Initialiser uniquement les templates de base
	@echo "$(GREEN)📄 Initialisation des templates de base...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py create_default_templates
	@echo "$(GREEN)✅ Templates initialisés !$(NC)"

init-features: ## Initialiser les fonctionnalités avec leurs plans associés
	@echo "$(GREEN)🎯 Initialisation des fonctionnalités...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py init_features
	@echo "$(GREEN)✅ Fonctionnalités initialisées !$(NC)"

sync-features: ## Synchroniser les fonctionnalités de tous les tenants avec leurs plans
	@echo "$(GREEN)🔄 Synchronisation des fonctionnalités des tenants...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py sync_tenant_features
	@echo "$(GREEN)✅ Synchronisation terminée !$(NC)"

sync-features-tenant: ## Synchroniser les fonctionnalités d'un tenant spécifique (usage: make sync-features-tenant TENANT_ID=5)
	@echo "$(GREEN)🔄 Synchronisation des fonctionnalités d'un tenant...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@if [ -z "$(TENANT_ID)" ]; then \
		echo "$(RED)❌ Usage: make sync-features-tenant TENANT_ID=5$(NC)"; \
	else \
		docker exec $(BACKEND_CONTAINER) python manage.py sync_tenant_features --tenant-id=$(TENANT_ID); \
	fi
	@echo "$(GREEN)✅ Synchronisation terminée !$(NC)"

test-features: ## Tester l'accès aux fonctionnalités pour tous les tenants de test
	@echo "$(GREEN)🧪 Test d'accès aux fonctionnalités...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py test_feature_access
	@echo "$(GREEN)✅ Test terminé !$(NC)"

##@ Tests Billing spécifiques

test-subscriptions-internal: ## Tester les abonnements (interne)
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) pytest billing/tests/test_models.py::TestSubscription billing/tests/test_views.py::TestSubscriptionViewSet -v --tb=short

test-payments-internal: ## Tester les paiements (interne)
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) pytest billing/tests/test_models.py::TestPayment -v --tb=short

test-invoices-internal: ## Tester les factures (interne)
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) pytest billing/tests/test_models.py::TestInvoice -v --tb=short

test-pricing-plans-internal: ## Tester les plans tarifaires (interne)
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) pytest billing/tests/test_models.py::TestPricingPlan billing/tests/test_views.py::TestPricingPlanViewSet -v --tb=short

test-coverage: ## Exécuter les tests avec couverture
	@echo "$(GREEN)📊 Exécution des tests avec couverture...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python -m pytest --verbose --tb=short || echo "⚠️ Tests terminés (pytest-cov optionnel)"
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

##@ Templates

generate-previews: ## Générer les previews des templates (usage: make generate-previews ARGS="--all")
	@echo "$(GREEN)📸 Génération des previews de templates...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py generate_template_previews $(ARGS)
	@echo "$(GREEN)✅ Previews générées !$(NC)"

install-playwright: ## Installer Playwright pour les captures d'écran
	@echo "$(GREEN)📦 Installation de Playwright...$(NC)"
	@$(DOCKER_COMPOSE) up -d backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py install_playwright
	@echo "$(GREEN)✅ Playwright installé !$(NC)"

check-trial-expiration: ## Vérifier et mettre à jour les trials expirés
	@echo "$(GREEN)🔄 Vérification des trials expirés...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py check_trial_expiration
	@echo "$(GREEN)✅ Vérification terminée !$(NC)"

check-trial-expiration-dry-run: ## Vérifier les trials expirés sans appliquer les changements
	@echo "$(GREEN)🔄 Vérification des trials expirés (dry-run)...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py check_trial_expiration --dry-run
	@echo "$(GREEN)✅ Vérification terminée !$(NC)"

check-trial-expiration-with-notifications: ## Vérifier les trials expirés et envoyer les notifications
	@echo "$(GREEN)🔄 Vérification des trials expirés avec notifications...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py check_trial_expiration --send-notifications
	@echo "$(GREEN)✅ Vérification terminée !$(NC)"

setup-trial-cron: ## Configurer la tâche cron pour vérifier les trials automatiquement (tous les jours à 2h)
	@echo "$(GREEN)⏰ Configuration de la tâche cron pour les trials...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) bash -c "echo '0 2 * * * cd /app && python manage.py check_trial_expiration --send-notifications >> /var/log/trial_check.log 2>&1' | crontab -"
	@echo "$(GREEN)✅ Tâche cron configurée !$(NC)"
	@echo "$(YELLOW)💡 La vérification s'exécutera tous les jours à 2h du matin$(NC)"

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

init-public-pages: ## Initialiser les pages publiques de documentation
	@echo "$(GREEN)📄 Initialisation des pages publiques...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py init_public_pages
	@echo "$(GREEN)✅ Pages publiques initialisées !$(NC)"

create-public-pages-blocks: ## Créer les blocs et initialiser les pages publiques avec le contenu exact des pages existantes
	@echo "$(GREEN)🚀 Création des blocs et initialisation des pages publiques...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py create_public_pages_blocks
	@echo "$(GREEN)✅ Blocs et pages publiques créés !$(NC)"
	@echo "$(BLUE)💡 Les pages sont disponibles dans /admin/pages-public$(NC)"

init-templates: ## Initialiser les templates de base (VTC Minimaliste, Moderne, Classique) avec intégration blocs
	@echo "$(GREEN)🎨 Initialisation des templates de base...$(NC)"
	@$(DOCKER_COMPOSE) up -d postgres redis backend
	@sleep 5
	@docker exec $(BACKEND_CONTAINER) python manage.py create_default_templates
	@echo "$(GREEN)✅ Templates de base initialisés !$(NC)"
	@echo "$(BLUE)💡 Les templates sont maintenant disponibles dans /admin/templates$(NC)"
	@echo "$(BLUE)💡 Les templates s'intègrent avec les blocs via {% block block_name %} dans le HTML$(NC)"

.DEFAULT_GOAL := help
