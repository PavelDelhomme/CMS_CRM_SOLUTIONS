#!/bin/bash
# Script pour vérifier les erreurs dans les logs du backend

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔍 Vérification des Erreurs Backend${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Vérifier que le backend est démarré
if ! docker ps | grep -q vtcbuilder-backend; then
    echo -e "${RED}❌ Le backend n'est pas démarré${NC}"
    exit 1
fi

# Analyser les logs
echo -e "\n${BLUE}📋 Analyse des 100 dernières lignes de logs...${NC}"
ERRORS=$(docker logs vtcbuilder-backend --tail 100 2>&1 | grep -E "ERROR|Exception|Traceback|500|FieldError" || true)

if [ -z "$ERRORS" ]; then
    echo -e "${GREEN}✅ Aucune erreur détectée dans les logs récents${NC}"
    exit 0
else
    echo -e "${RED}❌ Erreurs détectées :${NC}"
    echo "$ERRORS"
    exit 1
fi

