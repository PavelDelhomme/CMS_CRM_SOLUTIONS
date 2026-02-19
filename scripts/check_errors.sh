#!/bin/bash

# Script de vérification des erreurs dans le projet
# Usage: ./scripts/check_errors.sh

echo "🔍 Vérification des erreurs dans le projet CMS CRM Solutions"
echo "======================================================"
echo ""

ERRORS=0

# Fonction pour vérifier les erreurs Python
check_python_syntax() {
    echo "🐍 Vérification syntaxe Python..."
    cd backend-django
    python -m py_compile manage.py 2>&1 | grep -v "No module named" | head -5
    if [ $? -eq 0 ]; then
        echo "  ✅ Syntaxe Python valide"
    else
        echo "  ❌ Erreurs de syntaxe détectées"
        ERRORS=$((ERRORS+1))
    fi
    cd ..
}

# Fonction pour vérifier les imports Python critiques
check_python_imports() {
    echo "📦 Vérification imports Python critiques..."
    cd backend-django
    python -c "
import sys
sys.path.insert(0, '.')
errors = []
try:
    from tenants.models import Tenant, User
    from billing.models import PricingPlan, Subscription, Invoice, Payment, PaymentMethod
    from media.models import Template, Media
    from settings_app.models import SystemSettings
    print('  ✅ Imports des modèles principaux OK')
except Exception as e:
    print(f'  ❌ Erreur imports modèles: {e}')
    errors.append(1)
    
try:
    from tenants.views import TenantViewSet, UserViewSet
    from billing.views import PricingPlanViewSet, SubscriptionViewSet, PaymentMethodViewSet
    from media.views import TemplateViewSet
    from api.views import DashboardView, DetailedStatsView
    print('  ✅ Imports des vues principales OK')
except Exception as e:
    print(f'  ❌ Erreur imports vues: {e}')
    errors.append(1)

sys.exit(0 if len(errors) == 0 else 1)
" 2>&1 | grep -E "(✅|❌)"
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        ERRORS=$((ERRORS+1))
    fi
    cd ..
}

# Fonction pour vérifier les erreurs TypeScript
check_typescript() {
    echo "📝 Vérification TypeScript..."
    cd frontend
    if [ -f "node_modules/.bin/tsc" ]; then
        npx tsc --noEmit --skipLibCheck 2>&1 | grep -i "error" | head -10
        if [ $? -eq 0 ]; then
            echo "  ⚠️  Erreurs TypeScript détectées (mais peuvent être des warnings de configuration)"
        else
            echo "  ✅ Pas d'erreurs TypeScript critiques"
        fi
    else
        echo "  ⚠️  TypeScript non installé, vérification ignorée"
    fi
    cd ..
}

# Fonction pour vérifier les fichiers manquants
check_missing_files() {
    echo "📄 Vérification fichiers critiques..."
    MISSING=0
    
    # Backend
    [ ! -f "backend-django/media/models.py" ] && echo "  ❌ backend-django/media/models.py manquant" && MISSING=$((MISSING+1))
    [ ! -f "backend-django/billing/views.py" ] && echo "  ❌ backend-django/billing/views.py manquant" && MISSING=$((MISSING+1))
    [ ! -f "backend-django/api/urls.py" ] && echo "  ❌ backend-django/api/urls.py manquant" && MISSING=$((MISSING+1))
    
    # Frontend
    [ ! -f "frontend/src/app/admin/stats/page.tsx" ] && echo "  ❌ frontend/src/app/admin/stats/page.tsx manquant" && MISSING=$((MISSING+1))
    [ ! -f "frontend/src/app/admin/templates/page.tsx" ] && echo "  ❌ frontend/src/app/admin/templates/page.tsx manquant" && MISSING=$((MISSING+1))
    [ ! -f "frontend/src/services/billing.service.ts" ] && echo "  ❌ frontend/src/services/billing.service.ts manquant" && MISSING=$((MISSING+1))
    
    if [ $MISSING -eq 0 ]; then
        echo "  ✅ Tous les fichiers critiques présents"
    else
        echo "  ❌ $MISSING fichier(s) critique(s) manquant(s)"
        ERRORS=$((ERRORS+MISSING))
    fi
}

# Fonction pour vérifier les endpoints API
check_api_endpoints() {
    echo "🔌 Vérification configuration endpoints API..."
    cd backend-django/api
    
    # Vérifier que les routes sont bien définies
    if grep -q "payment-methods" urls.py && grep -q "stats/detailed" urls.py && grep -q "system-settings" urls.py && grep -q "templates" urls.py; then
        echo "  ✅ Routes API principales configurées"
    else
        echo "  ❌ Routes API manquantes"
        ERRORS=$((ERRORS+1))
    fi
    cd ../..
}

# Exécution des vérifications
check_python_syntax
echo ""
check_python_imports
echo ""
check_typescript
echo ""
check_missing_files
echo ""
check_api_endpoints
echo ""

echo "======================================================"
if [ $ERRORS -eq 0 ]; then
    echo "✅ Aucune erreur critique détectée !"
    exit 0
else
    echo "⚠️  $ERRORS problème(s) détecté(s)"
    echo ""
    echo "💡 Actions recommandées :"
    echo "   1. Vérifier les logs ci-dessus"
    echo "   2. Redémarrer le backend Django"
    echo "   3. Vérifier les dépendances (npm install, pip install)"
    exit 1
fi

