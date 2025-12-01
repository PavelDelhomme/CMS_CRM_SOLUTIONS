#!/bin/bash

# Script de sauvegarde de la base de données

set -e

BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "💾 Sauvegarde de la base de données..."

docker-compose exec -T db pg_dump -U postgres cms_crm_solutions > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Sauvegarde créée: $BACKUP_FILE"
    
    # Compresser
    gzip "$BACKUP_FILE"
    echo "✅ Sauvegarde compressée: $BACKUP_FILE.gz"
else
    echo "❌ Erreur lors de la sauvegarde"
    exit 1
fi

