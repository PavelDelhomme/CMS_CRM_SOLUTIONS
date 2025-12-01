#!/bin/bash

# Script de restauration de la base de données

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/restore_db.sh <fichier_backup.sql>"
    echo "Exemple: ./scripts/restore_db.sh backups/backup_20240101_120000.sql"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Fichier de sauvegarde non trouvé: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  ATTENTION: Cette opération va écraser la base de données actuelle!"
read -p "Êtes-vous sûr? (oui/non): " confirm

if [ "$confirm" != "oui" ]; then
    echo "❌ Opération annulée"
    exit 1
fi

echo "🔄 Restauration de la base de données..."

if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | docker-compose exec -T db psql -U postgres cms_crm_solutions
else
    docker-compose exec -T db psql -U postgres cms_crm_solutions < "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo "✅ Base de données restaurée avec succès"
else
    echo "❌ Erreur lors de la restauration"
    exit 1
fi

