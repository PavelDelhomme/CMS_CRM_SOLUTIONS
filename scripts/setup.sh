#!/bin/bash

# Script d'installation complète de CMS_CRM_SOLUTIONS

set -e

echo "🚀 Installation de CMS_CRM_SOLUTIONS..."

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env..."
    cp .env.example .env
    echo "⚠️  Veuillez configurer le fichier .env avant de continuer"
    echo "   Éditez .env et modifiez les valeurs nécessaires"
    read -p "Appuyez sur Entrée une fois le fichier .env configuré..."
fi

# Installation backend
echo "📦 Installation des dépendances backend..."
cd backend-django
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Installation frontend
echo "📦 Installation des dépendances frontend..."
cd frontend
npm install
cd ..

# Build Docker
echo "🐳 Construction des images Docker..."
docker-compose build

# Démarrer les services
echo "🚀 Démarrage des services..."
docker-compose up -d

# Attendre que la base de données soit prête
echo "⏳ Attente de la base de données..."
sleep 10

# Migrations
echo "🔄 Application des migrations..."
cd backend-django
source venv/bin/activate
python manage.py migrate_schemas
cd ..

echo "✅ Installation terminée!"
echo ""
echo "🌐 Frontend: http://localhost:9494"
echo "🔧 API: http://localhost:9495/api"
echo "⚙️  Admin: http://localhost:9495/admin"
echo ""
echo "Pour créer un super utilisateur:"
echo "  cd backend-django && source venv/bin/activate && python manage.py createsuperuser"

