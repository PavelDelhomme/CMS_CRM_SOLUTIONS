#!/bin/bash

# Script pour vérifier les erreurs de syntaxe dans le frontend
# Continue à vérifier toutes les erreurs au lieu de s'arrêter à la première

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS_FOUND=0

echo -e "${GREEN}🔍 Vérification des erreurs de syntaxe dans le frontend...${NC}"
echo ""

cd "$(dirname "$0")/../../frontend" || exit 1

# Vérifier si le container est en cours d'exécution
if ! docker ps | grep -q vtcbuilder-frontend; then
    echo -e "${RED}❌ Le container frontend n'est pas en cours d'exécution${NC}"
    exit 1
fi

# Vérifier la syntaxe TypeScript (exclure les fichiers de test)
echo -e "${YELLOW}📝 Vérification de la syntaxe TypeScript...${NC}"
TSC_OUTPUT=$(docker exec vtcbuilder-frontend npm run type-check 2>&1 || true)
# Filtrer les erreurs pour exclure les fichiers de test (qui nécessitent @types/jest)
TSC_ERRORS=$(echo "$TSC_OUTPUT" | grep -E "error TS[0-9]+" | grep -v "__tests__" || true)

if [ -n "$TSC_ERRORS" ]; then
    echo -e "${RED}❌ Erreurs de syntaxe TypeScript détectées :${NC}"
    echo ""
    # Afficher toutes les erreurs, une par ligne
    echo "$TSC_ERRORS" | while IFS= read -r line; do
        echo -e "${RED}  $line${NC}"
    done
    ERRORS_FOUND=1
    echo ""
    # Afficher aussi le nombre total d'erreurs
    ERROR_COUNT=$(echo "$TSC_ERRORS" | wc -l)
    echo -e "${RED}  Total: $ERROR_COUNT erreur(s) TypeScript${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Aucune erreur de syntaxe TypeScript${NC}"
fi

# Vérifier les erreurs ESLint
echo -e "${YELLOW}📝 Vérification ESLint...${NC}"
ESLINT_OUTPUT=$(docker exec vtcbuilder-frontend npm run lint 2>&1 || true)
ESLINT_ERRORS=$(echo "$ESLINT_OUTPUT" | grep -E "Error:|error" || true)

if [ -n "$ESLINT_ERRORS" ]; then
    echo -e "${YELLOW}⚠️  Erreurs ESLint détectées :${NC}"
    echo ""
    # Afficher toutes les erreurs
    echo "$ESLINT_ERRORS" | while IFS= read -r line; do
        echo -e "${YELLOW}  $line${NC}"
    done
    ERRORS_FOUND=1
    echo ""
else
    echo -e "${GREEN}✅ Aucune erreur ESLint${NC}"
fi

echo ""
if [ $ERRORS_FOUND -eq 1 ]; then
    echo -e "${RED}❌ Des erreurs ont été détectées. Veuillez les corriger.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Vérification terminée - Aucune erreur détectée !${NC}"
    exit 0
fi

