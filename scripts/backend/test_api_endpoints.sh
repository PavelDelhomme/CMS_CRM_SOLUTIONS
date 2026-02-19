#!/bin/bash
# Script pour tester tous les endpoints de l'API
# Utilise les variables d'environnement pour la configuration

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend-django"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🧪 Tests des Endpoints API${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Vérifier que le backend est démarré
if ! docker ps | grep -q cms_crm_backend; then
    echo -e "${YELLOW}⚠️  Le backend n'est pas démarré. Démarrage...${NC}"
    cd "$PROJECT_ROOT" && make start
    echo -e "${BLUE}⏳ Attente du démarrage du backend...${NC}"
    sleep 10
fi

# Exécuter les tests
echo -e "${BLUE}📋 Exécution des tests...${NC}"
cd "$BACKEND_DIR"

if docker exec cms_crm_backend python tests/api/test_all_endpoints.py; then
    echo -e "\n${GREEN}✅ Tests terminés avec succès !${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Certains tests ont échoué${NC}"
    exit 1
fi

