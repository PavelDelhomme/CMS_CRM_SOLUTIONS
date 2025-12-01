#!/bin/bash

# Script pour afficher le statut des services CMS_CRM_SOLUTIONS

COMPOSE_FILE="docker-compose.yml"

echo ""
echo "📊 Statut détaillé des services CMS_CRM_SOLUTIONS"
echo ""
echo "=========================================="
echo ""
echo "🟢 Services essentiels:"
echo ""

# Services avec leurs noms d'affichage (dans l'ordre d'affichage)
declare -A SERVICES=(
    ["db"]="postgres"
    ["redis"]="redis"
    ["backend"]="backend"
    ["frontend"]="frontend"
    ["nginx"]="nginx"
)

# Vérifier chaque service
UP_COUNT=0
TOTAL_COUNT=0

for service in "${!SERVICES[@]}"; do
    display_name="${SERVICES[$service]}"
    if docker-compose -f "$COMPOSE_FILE" ps "$service" 2>/dev/null | grep -q "Up"; then
        echo "  ✅ UP   $display_name"
        UP_COUNT=$((UP_COUNT+1))
    else
        echo "  ❌ DOWN $display_name"
    fi
    TOTAL_COUNT=$((TOTAL_COUNT+1))
done

echo ""
echo "🔵 Services optionnels:"
echo ""
echo "  ⚪ N/A  (aucun service optionnel configuré)"
echo ""
echo "📊 Résumé : $UP_COUNT/$TOTAL_COUNT services actifs"
echo ""
echo "🔍 Vérification de la base de données..."

if docker-compose -f "$COMPOSE_FILE" ps db 2>/dev/null | grep -q "Up"; then
    if docker-compose -f "$COMPOSE_FILE" exec -T db psql -U postgres -d cms_crm_solutions -c "\q" 2>/dev/null; then
        SCHEMA_COUNT=$(docker-compose -f "$COMPOSE_FILE" exec -T db psql -U postgres -d cms_crm_solutions -t -c "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast');" 2>/dev/null | tr -d ' \n' || echo "0")
        echo "  ✅ Base de données accessible"
        echo "  📋 Schémas disponibles : $SCHEMA_COUNT"
    else
        echo "  ⚠️  Base de données démarrée mais connexion impossible"
    fi
else
    echo "  ⚠️  PostgreSQL non démarré, vérification de la base de données impossible"
fi

echo ""

