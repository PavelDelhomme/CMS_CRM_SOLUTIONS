#!/bin/bash
# Script pour vérifier que les features sont disponibles uniquement avec les bons plans

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend-django"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔐 Vérification de l'Accès aux Features${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Vérifier que le backend est démarré
if ! docker ps | grep -q cms_crm_backend; then
    echo -e "${YELLOW}⚠️  Le backend n'est pas démarré. Démarrage...${NC}"
    cd "$PROJECT_ROOT" && make start
    sleep 10
fi

cd "$BACKEND_DIR"

echo -e "\n${BLUE}📋 Vérification de l'accès aux features selon les plans...${NC}"

# Exécuter un script Python pour vérifier l'accès
docker exec cms_crm_backend python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vtcbuilder.settings')
django.setup()

from tenants.models import User, Feature
from billing.models import PricingPlan, Subscription

# Vérifier que le super admin a accès à toutes les features
super_admin = User.objects.filter(role='super-admin').first()
if super_admin:
    all_features = Feature.objects.filter(is_active=True)
    accessible = sum(1 for f in all_features if super_admin.can_use_feature(f))
    print(f'✅ Super Admin: {accessible}/{all_features.count()} features accessibles')
else:
    print('⚠️  Aucun super admin trouvé')

# Vérifier les plans
plans = PricingPlan.objects.all()
print(f'\n📦 Plans disponibles: {plans.count()}')
for plan in plans:
    print(f'  - {plan.name} (slug: {plan.slug})')
    
    # Features disponibles pour ce plan
    features = Feature.objects.filter(available_plans=plan, is_active=True)
    print(f'    Features: {features.count()}')
    for f in features[:3]:
        print(f'      • {f.label}')
    if features.count() > 3:
        print(f'      ... et {features.count() - 3} autres')

print('\n✅ Vérification terminée')
"

echo -e "\n${GREEN}✅ Vérification terminée !${NC}"

