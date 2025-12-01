.PHONY: help setup dev shell migrate migrations test lint format clean

help: ## Affiche l'aide
	@echo "Backend Django - Commandes disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Installation complète
	@echo "📦 Installation des dépendances..."
	pip install -r requirements.txt
	@echo "✅ Installation terminée!"

dev: ## Démarre le serveur de développement
	python manage.py runserver

shell: ## Ouvre un shell Django
	python manage.py shell

migrate: ## Applique les migrations
	python manage.py migrate_schemas

migrations: ## Crée de nouvelles migrations
	@read -p "Nom de l'app: " app; \
	python manage.py makemigrations $$app

test: ## Lance les tests
	pytest

test-coverage: ## Tests avec couverture
	pytest --cov=. --cov-report=html

lint: ## Vérifie le code
	flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
	flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics

format: ## Formate le code
	black .

clean: ## Nettoie les fichiers temporaires
	find . -type d -name __pycache__ -exec rm -r {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	rm -rf .pytest_cache
	rm -rf htmlcov
	rm -rf .coverage

superuser: ## Crée un super utilisateur
	python manage.py createsuperuser

tenant: ## Crée un nouveau tenant
	@read -p "Nom du tenant: " name; \
	read -p "Domaine (ex: example.com): " domain; \
	python manage.py create_tenant --name "$$name" --domain "$$domain"

