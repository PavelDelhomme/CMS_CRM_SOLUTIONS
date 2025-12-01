#!/bin/bash

# Script pour ajouter les classes dark mode aux champs de formulaire

# Trouver tous les fichiers .tsx dans admin
find frontend/src/app/admin -name "*.tsx" -type f | while read file; do
    # Backup
    cp "$file" "$file.bak"
    
    # Remplacements pour les inputs/selects/textarea
    # Pattern: border-gray-300 -> border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100
    
    # Cas 1: border border-gray-300
    sed -i 's/border border-gray-300\([^"]*\)"/border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100\1"/g' "$file"
    
    # Cas 2: border-gray-300 seul (dans select)
    sed -i 's/border-gray-300 shadow-sm\([^"]*\)"/border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm\1"/g' "$file"
    
    # Cas 3: border-gray-300 avec focus (sans dark: déjà présent)
    sed -i 's/border-gray-300\([^"]*focus[^"]*\)"/border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100\1"/g' "$file" 2>/dev/null
    
    # Supprimer les doublons dark:
    sed -i 's/dark:border-gray-600 dark:border-gray-600/dark:border-gray-600/g' "$file"
    sed -i 's/dark:bg-gray-700 dark:bg-gray-700/dark:bg-gray-700/g' "$file"
    sed -i 's/dark:text-gray-100 dark:text-gray-100/dark:text-gray-100/g' "$file"
    
    # Supprimer le backup si pas de changement
    if diff -q "$file" "$file.bak" > /dev/null 2>&1; then
        rm "$file.bak"
    else
        echo "✅ Modifié: $file"
    fi
done

echo "✅ Traitement terminé !"

