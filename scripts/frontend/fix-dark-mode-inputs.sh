#!/bin/bash

# Script pour ajouter les classes dark mode aux champs de formulaire

# Couleur de base pour les champs
INPUT_DARK_BG="dark:bg-gray-700"
INPUT_DARK_BORDER="dark:border-gray-600"
INPUT_DARK_TEXT="dark:text-gray-100"
INPUT_DARK_PLACEHOLDER="dark:placeholder-gray-400"

# Pattern de remplacement pour les inputs
# Remplacer border-gray-300 par border-gray-300 dark:border-gray-600
# Ajouter dark:bg-gray-700 dark:text-gray-100

find frontend/src/app/admin -name "*.tsx" -type f | while read file; do
    # Backup
    cp "$file" "$file.bak"
    
    # Ajouter dark mode aux inputs avec border-gray-300
    sed -i "s/border border-gray-300 rounded/border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded/g" "$file"
    
    # Ajouter dark mode aux inputs avec border-gray-300 qui ont déjà focus
    sed -i "s/border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2/border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2/g" "$file"
    
    # Ajouter dark mode aux placeholders
    sed -i "s/placeholder-/placeholder-gray-400 dark:placeholder-gray-500 /g" "$file"
    
    # Nettoyer les doublons
    sed -i "s/dark:border-gray-600 dark:border-gray-600/dark:border-gray-600/g" "$file"
    sed -i "s/dark:bg-gray-700 dark:bg-gray-700/dark:bg-gray-700/g" "$file"
    sed -i "s/dark:text-gray-100 dark:text-gray-100/dark:text-gray-100/g" "$file"
    
    echo "✅ Traité: $file"
done

echo "✅ Tous les fichiers ont été traités !"

