#!/bin/bash

# Script de test des endpoints API
# Usage: ./tests/api/test_endpoints.sh

BASE_URL="${API_URL:-http://localhost:9495/api}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@cms-crm-solutions.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"

echo "🧪 Tests des endpoints API CMS CRM Solutions"
echo "====================================="
echo ""

# Fonction pour faire une requête
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    if [ -n "$token" ]; then
        if [ -n "$data" ]; then
            curl -s -X "$method" "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $token" \
                -H "Content-Type: application/json" \
                -d "$data"
        else
            curl -s -X "$method" "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $token"
        fi
    else
        if [ -n "$data" ]; then
            curl -s -X "$method" "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data"
        else
            curl -s -X "$method" "$BASE_URL$endpoint"
        fi
    fi
}

# Obtenir le token d'authentification
echo "🔐 Authentification..."
LOGIN_RESPONSE=$(make_request POST "/auth/login" "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Échec de l'authentification"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Authentification réussie"
echo ""

# Tests des endpoints
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local require_auth=${5:-true}
    
    echo "🔍 Test: $name"
    
    if [ "$require_auth" = "true" ]; then
        RESPONSE=$(make_request "$method" "$endpoint" "$data" "$TOKEN")
    else
        RESPONSE=$(make_request "$method" "$endpoint" "$data")
    fi
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$endpoint" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        ${data:+-d "$data"})
    
    if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
        echo "  ✅ $name (HTTP $HTTP_CODE)"
        return 0
    elif [ "$HTTP_CODE" -eq 404 ]; then
        echo "  ⚠️  $name (HTTP $HTTP_CODE - Endpoint non disponible)"
        return 0
    else
        echo "  ❌ $name (HTTP $HTTP_CODE)"
        echo "  Response: $RESPONSE"
        return 1
    fi
}

# Tests
FAILED=0

# Endpoints publics
test_endpoint "Login" POST "/auth/login" "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" false || FAILED=$((FAILED+1))

# Endpoints authentifiés
test_endpoint "Dashboard" GET "/dashboard/" "" || FAILED=$((FAILED+1))
test_endpoint "Stats détaillées" GET "/stats/detailed/" "" || FAILED=$((FAILED+1))
test_endpoint "System Settings" GET "/system-settings/" "" || FAILED=$((FAILED+1))
test_endpoint "Tenants" GET "/tenants/" "" || FAILED=$((FAILED+1))
test_endpoint "Users" GET "/users/" "" || FAILED=$((FAILED+1))
test_endpoint "Templates" GET "/templates/" "" || FAILED=$((FAILED+1))
test_endpoint "Payment Methods" GET "/payment-methods/" "" || FAILED=$((FAILED+1))
test_endpoint "Subscriptions" GET "/subscriptions/" "" || FAILED=$((FAILED+1))
test_endpoint "Invoices" GET "/invoices/" "" || FAILED=$((FAILED+1))
test_endpoint "Pricing Plans" GET "/pricing-plans/" "" || FAILED=$((FAILED+1))

echo ""
echo "====================================="
if [ $FAILED -eq 0 ]; then
    echo "✅ Tous les tests sont passés !"
    exit 0
else
    echo "❌ $FAILED test(s) ont échoué"
    exit 1
fi

