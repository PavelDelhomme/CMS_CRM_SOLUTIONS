#!/bin/bash

# Script pour remplacer Tenant par Client dans tous les fichiers Python du backend

set -e

echo "🔄 Remplacement de Tenant par Client dans le backend..."

cd backend-django

# Remplacer dans tous les fichiers Python (sauf migrations)
find . -type f -name "*.py" ! -path "*/migrations/*" ! -path "*/__pycache__/*" -print0 | while IFS= read -r -d '' file; do
    if grep -q "Tenant" "$file"; then
        # Sauvegarder
        cp "$file" "$file.bak"
        
        # Remplacer
        sed -i 's/from tenants.models import Tenant/from tenants.models import Client/g' "$file"
        sed -i 's/from tenants.models import Tenant,/from tenants.models import Client,/g' "$file"
        sed -i 's/, Tenant,/, Client,/g' "$file"
        sed -i 's/, Tenant$/, Client/g' "$file"
        sed -i 's/Tenant\./Client./g' "$file"
        sed -i 's/ForeignKey(Tenant/ForeignKey(Client/g' "$file"
        sed -i 's/OneToOneField(Tenant/OneToOneField(Client/g' "$file"
        sed -i 's/tenant = models.ForeignKey(Tenant/tenant = models.ForeignKey(Client/g' "$file"
        sed -i 's/tenant = models.OneToOneField(Tenant/tenant = models.OneToOneField(Client/g' "$file"
        
        # Vérifier si des changements ont été faits
        if ! diff -q "$file" "$file.bak" > /dev/null; then
            echo "  ✅ $file"
            rm "$file.bak"
        else
            rm "$file.bak"
        fi
    fi
done

echo ""
echo "✅ Remplacement terminé !"

