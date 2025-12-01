#!/bin/bash

# Script pour vérifier les erreurs de syntaxe dans le frontend

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔍 Vérification des erreurs de syntaxe dans le frontend...${NC}"
echo ""

cd "$(dirname "$0")/../../frontend" || exit 1

# Vérifier si le container est en cours d'exécution
if ! docker ps | grep -q vtcbuilder-frontend; then
    echo -e "${RED}❌ Le container frontend n'est pas en cours d'exécution${NC}"
    exit 1
fi

# Vérifier la syntaxe TypeScript
echo -e "${YELLOW}📝 Vérification de la syntaxe TypeScript...${NC}"
if docker exec vtcbuilder-frontend npm run type-check 2>&1 | tee /tmp/typecheck.log | grep -q "error"; then
    echo -e "${RED}❌ Erreurs de syntaxe TypeScript détectées${NC}"
    docker exec vtcbuilder-frontend npm run type-check 2>&1 | grep "error" | head -20
    exit 1
else
    echo -e "${GREEN}✅ Aucune erreur de syntaxe TypeScript${NC}"
fi

# Vérifier les erreurs ESLint
echo -e "${YELLOW}📝 Vérification ESLint...${NC}"
if docker exec vtcbuilder-frontend npm run lint 2>&1 | tee /tmp/lint.log | grep -q "error"; then
    echo -e "${YELLOW}⚠️  Avertissements ESLint détectés (non bloquant)${NC}"
    docker exec vtcbuilder-frontend npm run lint 2>&1 | grep "error" | head -20
else
    echo -e "${GREEN}✅ Aucune erreur ESLint${NC}"
fi

echo ""
echo -e "${GREEN}✅ Vérification terminée !${NC}"

