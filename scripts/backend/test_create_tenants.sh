#!/bin/bash

# Script de test pour créer des tenants pour tous les plans tarifaires
# Usage: ./test_create_tenants.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧪 Test de création de tenants pour tous les plans tarifaires${NC}"
echo "=========================================="
echo ""

cd backend-django

echo "📦 Exécution de la commande de création..."
docker-compose -f ../docker-compose.simple.yml exec -T backend python manage.py create_tenants_for_plans

echo ""
echo -e "${GREEN}✅ Test terminé !${NC}"
echo ""
echo "Vérification des tenants créés..."
docker-compose -f ../docker-compose.simple.yml exec -T backend python manage.py shell -c "
from tenants.models import Tenant
from billing.models import Subscription, PricingPlan

print('\n📊 Tenants créés:')
for tenant in Tenant.objects.filter(slug__startswith='demo-').order_by('slug'):
    print(f'  - {tenant.name} ({tenant.slug})')
    try:
        sub = Subscription.objects.get(tenant=tenant)
        print(f'    Plan: {sub.plan.name} | Status: {sub.status}')
    except:
        print(f'    ⚠️  Pas d\'abonnement')

print('\n📦 Plans tarifaires disponibles:')
for plan in PricingPlan.objects.filter(is_active=True).order_by('order'):
    print(f'  - {plan.name} ({plan.slug})')
"

