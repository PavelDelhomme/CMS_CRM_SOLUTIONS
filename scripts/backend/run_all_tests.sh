#!/bin/bash
# Script pour exécuter tous les tests backend

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
echo -e "${GREEN}🧪 EXÉCUTION DE TOUS LES TESTS BACKEND${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$PROJECT_ROOT"

# 1. Vérifier les erreurs dans les logs
echo -e "\n${BLUE}1️⃣  Vérification des erreurs dans les logs...${NC}"
make check-errors || echo -e "${YELLOW}⚠️  Des erreurs ont été détectées${NC}"

# 2. Tests des endpoints API
echo -e "\n${BLUE}2️⃣  Tests des endpoints API...${NC}"
make test-api || {
    echo -e "${RED}❌ Les tests API ont échoué${NC}"
    exit 1
}

# 3. Vérification de l'accès aux features
echo -e "\n${BLUE}3️⃣  Vérification de l'accès aux features...${NC}"
make verify-features || {
    echo -e "${YELLOW}⚠️  La vérification des features a échoué${NC}"
}

# 4. Tests unitaires pytest
echo -e "\n${BLUE}4️⃣  Tests unitaires (pytest)...${NC}"
cd "$BACKEND_DIR" && make test || {
    echo -e "${YELLOW}⚠️  Certains tests unitaires ont échoué${NC}"
}

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ TOUS LES TESTS TERMINÉS${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

