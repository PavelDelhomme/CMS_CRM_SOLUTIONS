#!/bin/bash

# Script pour créer/mettre à jour les fichiers .env du projet

set -e

echo "🔧 Configuration des fichiers .env pour CMS_CRM_SOLUTIONS"
echo ""

# Générer une SECRET_KEY sécurisée
generate_secret_key() {
    python3 -c "import secrets; print(secrets.token_urlsafe(50))"
}

SECRET_KEY=$(generate_secret_key)

# 1. .env à la racine
echo "📝 Création/mise à jour de .env (racine)..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "  ✅ Fichier .env créé depuis env.example"
else
    echo "  ℹ️  Fichier .env existe déjà"
fi

# Mettre à jour SECRET_KEY si nécessaire
if grep -q "your-secret-key-change-in-production" .env 2>/dev/null; then
    sed -i "s/your-secret-key-change-in-production/$SECRET_KEY/" .env
    echo "  ✅ SECRET_KEY générée et mise à jour"
fi

# 2. backend-django/.env
echo ""
echo "📝 Création/mise à jour de backend-django/.env..."
if [ ! -f backend-django/.env ]; then
    if [ -f backend-django/.env.example ]; then
        cp backend-django/.env.example backend-django/.env
        echo "  ✅ Fichier créé depuis .env.example"
    else
        cat > backend-django/.env << EOF
# Backend Django Configuration
SECRET_KEY=$SECRET_KEY
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cms_crm_solutions
DB_USER=postgres
DB_PASSWORD=postgres
REDIS_HOST=localhost
REDIS_PORT=6379
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
EOF
        echo "  ✅ Fichier créé avec configuration par défaut"
    fi
else
    echo "  ℹ️  Fichier .env existe déjà"
    # Vérifier si SECRET_KEY existe
    if ! grep -q "^SECRET_KEY=" backend-django/.env 2>/dev/null; then
        echo "SECRET_KEY=$SECRET_KEY" >> backend-django/.env
        echo "  ✅ SECRET_KEY ajoutée"
    fi
fi

# 3. frontend/.env
echo ""
echo "📝 Création/mise à jour de frontend/.env..."
if [ ! -f frontend/.env ]; then
    if [ -f frontend/.env.example ]; then
        cp frontend/.env.example frontend/.env
        echo "  ✅ Fichier créé depuis .env.example"
    else
        cat > frontend/.env << EOF
# Frontend Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:9495/api
NODE_ENV=development
EOF
        echo "  ✅ Fichier créé avec configuration par défaut"
    fi
else
    echo "  ℹ️  Fichier .env existe déjà"
    # Vérifier si NEXT_PUBLIC_API_URL existe
    if ! grep -q "^NEXT_PUBLIC_API_URL=" frontend/.env 2>/dev/null; then
        echo "" >> frontend/.env
        echo "NEXT_PUBLIC_API_URL=http://localhost:9495/api" >> frontend/.env
        echo "  ✅ NEXT_PUBLIC_API_URL ajouté"
    fi
fi

echo ""
echo "✅ Configuration des fichiers .env terminée !"
echo ""
echo "📋 Fichiers créés/mis à jour:"
echo "  - .env"
echo "  - backend-django/.env"
echo "  - frontend/.env"
echo ""
echo "⚠️  N'oubliez pas de configurer les variables selon votre environnement !"
echo "   (notamment les mots de passe, clés API, etc.)"

