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
        if docker-compose -f ../docker-compose.django.yml ps $service | grep -q "Up"; then
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
docker-compose -f ../docker-compose.django.yml up -d postgres redis

# Attendre PostgreSQL
wait_for_service postgres

# Attendre Redis
wait_for_service redis

# Démarrer le backend Django
echo "🔧 Démarrage du backend Django..."
docker-compose -f ../docker-compose.django.yml up -d backend

# Attendre que Django soit prêt
sleep 10

# Démarrer le frontend
echo "🔧 Démarrage du frontend..."
docker-compose -f ../docker-compose.django.yml up -d frontend

# Démarrer PgAdmin
echo "🔧 Démarrage de PgAdmin..."
docker-compose -f ../docker-compose.django.yml up -d pgadmin

# Démarrer Traefik en dernier
echo "🔧 Démarrage de Traefik..."
docker-compose -f ../docker-compose.django.yml up -d traefik

echo ""
echo "🎉 VTCBuilder Django est démarré !"
echo ""
echo "📍 URLs d'accès :"
echo "   Frontend:     http://localhost:8001"
echo "   API Django:   http://api.localhost:7080/api/"
echo "   Admin:        http://api.localhost:7080/admin/"
echo "   Traefik:      http://localhost:7081"
echo "   PgAdmin:      http://localhost:8082"
echo ""
echo "🔐 Comptes de test :"
echo "   Super Admin: admin@vtcbuilder.com / admin123"
echo "   Demo Tenant: admin@demo-vtc-company.com / admin123"
echo ""
echo "💡 Utilisez 'make logs' pour voir les logs"
echo "💡 Utilisez 'make stop' pour arrêter tous les services"
