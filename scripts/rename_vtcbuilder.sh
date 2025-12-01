#!/bin/bash

# Script pour remplacer toutes les références VTCBuilder par CMS_CRM_SOLUTIONS

set -e

echo "🔄 Remplacement de VTCBuilder par CMS_CRM_SOLUTIONS..."

# Fonction pour remplacer dans un fichier
replace_in_file() {
    local file=$1
    if [ -f "$file" ]; then
        # Sauvegarder l'original
        cp "$file" "$file.bak"
        
        # Remplacer toutes les variantes
        sed -i 's/vtcbuilder/cms_crm_solutions/g' "$file"
        sed -i 's/VTCBuilder/CMS_CRM_SOLUTIONS/g' "$file"
        sed -i 's/VTC_BUILDER/CMS_CRM_SOLUTIONS/g' "$file"
        sed -i 's/vtc_builder/cms_crm_solutions/g' "$file"
        sed -i 's/vtcbuilder\.com/cms-crm-solutions.com/g' "$file"
        sed -i 's/@vtcbuilder\.com/@cms-crm-solutions.com/g' "$file"
        
        # Vérifier si des changements ont été faits
        if ! diff -q "$file" "$file.bak" > /dev/null; then
            echo "  ✅ $file"
            rm "$file.bak"
            return 0
        else
            rm "$file.bak"
            return 1
        fi
    fi
    return 1
}

# Traiter les fichiers Docker
echo "📦 Fichiers Docker..."
for file in docker-compose*.yml; do
    if [ -f "$file" ]; then
        replace_in_file "$file"
    fi
done

# Traiter les scripts
echo "📜 Scripts..."
find scripts -type f -name "*.sh" 2>/dev/null | while read file; do
    replace_in_file "$file"
done

# Traiter les fichiers de configuration backend
echo "🔧 Configuration backend..."
for file in backend-django/.env* backend-django/*.py backend-django/**/*.py 2>/dev/null; do
    if [ -f "$file" ] && [[ ! "$file" =~ __pycache__ ]] && [[ ! "$file" =~ migrations ]]; then
        replace_in_file "$file" 2>/dev/null || true
    fi
done

# Traiter les fichiers frontend (sauf node_modules)
echo "⚛️  Frontend..."
find frontend -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" \) 2>/dev/null | \
    grep -v node_modules | grep -v ".next" | while read file; do
    replace_in_file "$file" 2>/dev/null || true
done

echo ""
echo "✅ Remplacement terminé !"
echo ""
echo "⚠️  Note: Les fichiers package-lock.json peuvent nécessiter 'npm install' pour être régénérés"

