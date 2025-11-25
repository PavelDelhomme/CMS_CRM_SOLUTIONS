#!/bin/bash

# Script de démarrage pour VTCBuilder Django
# Ce script évite les problèmes de timing avec PostgreSQL

set -e

echo "🚀 Démarrage de VTCBuilder Django..."

# Fonction pour attendre qu'un service soit prêt
wait_for_service() {
    local service=$1
    local max_attempts=30
    local attempt=1

    echo "⏳ Attente du démarrage de $service..."

    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f ../docker-compose.simple.yml ps $service | grep -q "Up"; then
            echo "✅ $service est démarré !"
            return 0
        fi

        echo "  Tentative $attempt/$max_attempts..."
        sleep 2
        ((attempt++))
    done

    echo "❌ $service n'a pas démarré après $max_attempts tentatives"
    exit 1
}

# Démarrer les services de base
echo "🔧 Démarrage de PostgreSQL et Redis..."
docker-compose -f ../docker-compose.simple.yml up -d postgres redis

# Attendre PostgreSQL
wait_for_service postgres

# Attendre Redis
wait_for_service redis

# Démarrer le backend Django
echo "🔧 Démarrage du backend Django..."
docker-compose -f ../docker-compose.simple.yml up -d backend

# Attendre que Django soit prêt
sleep 10

# Démarrer le frontend
echo "🔧 Démarrage du frontend..."
docker-compose -f ../docker-compose.simple.yml up -d frontend

# Démarrer PgAdmin
echo "🔧 Démarrage de PgAdmin..."
docker-compose -f ../docker-compose.simple.yml up -d pgadmin

echo ""
echo "🎉 VTCBuilder Django est démarré !"
echo ""
echo "📍 URLs d'accès :"
echo "   Frontend:     http://localhost:9494"
echo "   API Django:   http://localhost:9495/api/"
echo "   Admin:        http://localhost:9495/admin/"
echo "   PgAdmin:      http://localhost:9498"
echo "   PostgreSQL:   localhost:9496"
echo "   Redis:        localhost:9497"
echo ""
echo "🔐 Comptes de test :"
echo "   Super Admin: admin@vtcbuilder.com / admin123"
echo "   Demo Tenant: admin@demo-vtc-company.com / admin123"
echo ""
echo "💡 Utilisez 'make logs' pour voir les logs"
echo "💡 Utilisez 'make stop' pour arrêter tous les services"
