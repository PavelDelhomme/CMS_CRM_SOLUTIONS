#!/usr/bin/env python3
"""
Script pour ajouter les classes dark mode aux champs de formulaire (input, select, textarea)
dans tous les fichiers admin.
"""

import os
import re
from pathlib import Path

# Répertoire à traiter
ADMIN_DIR = Path(__file__).parent.parent / "app" / "admin"

# Patterns de remplacement
PATTERNS = [
    # Input/Select/Textarea avec border-gray-300
    (
        r'className="([^"]*border\s+border-gray-300[^"]*)"',
        lambda m: f'className="{add_dark_mode_classes(m.group(1))}"'
    ),
    # Input/Select/Textarea avec border-gray-300 (sans border au début)
    (
        r'className="([^"]*border-gray-300[^"]*)"',
        lambda m: f'className="{add_dark_mode_classes(m.group(1))}"'
    ),
]

def add_dark_mode_classes(class_str):
    """Ajoute les classes dark mode si elles n'existent pas déjà"""
    # Vérifier si les classes dark mode existent déjà
    if 'dark:bg-gray-700' in class_str or 'dark:border-gray-600' in class_str:
        return class_str
    
    # Ajouter dark mode classes
    classes_to_add = []
    
    # Background
    if 'bg-white' not in class_str and 'bg-' not in class_str:
        classes_to_add.append('dark:bg-gray-700')
    
    # Border
    if 'border-gray-300' in class_str:
        class_str = class_str.replace('border-gray-300', 'border-gray-300 dark:border-gray-600')
    
    # Text color
    if 'text-gray-' not in class_str and 'text-white' not in class_str and 'text-black' not in class_str:
        classes_to_add.append('dark:text-gray-100')
    
    # Placeholder
    if 'placeholder' in class_str:
        class_str = class_str.replace('placeholder-', 'placeholder-gray-400 dark:placeholder-gray-500 ')
    
    # Ajouter les classes supplémentaires
    if classes_to_add:
        # Insérer après les classes de base
        parts = class_str.split()
        insert_pos = len(parts)
        for i, part in enumerate(parts):
            if 'border' in part or 'rounded' in part:
                insert_pos = i + 1
                break
        parts[insert_pos:insert_pos] = classes_to_add
        class_str = ' '.join(parts)
    
    return class_str

def process_file(file_path):
    """Traite un fichier et ajoute les classes dark mode"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Traiter tous les champs de formulaire
        # Input fields
        content = re.sub(
            r'(<input[^>]*className=")([^"]*border[^"]*border-gray-300[^"]*)(")',
            lambda m: m.group(1) + add_dark_mode_classes(m.group(2)) + m.group(3),
            content
        )
        
        # Select fields
        content = re.sub(
            r'(<select[^>]*className=")([^"]*border[^"]*border-gray-300[^"]*)(")',
            lambda m: m.group(1) + add_dark_mode_classes(m.group(2)) + m.group(3),
            content
        )
        
        # Textarea fields
        content = re.sub(
            r'(<textarea[^>]*className=")([^"]*border[^"]*border-gray-300[^"]*)(")',
            lambda m: m.group(1) + add_dark_mode_classes(m.group(2)) + m.group(3),
            content
        )
        
        # Traiter aussi les cas où border-gray-300 est seul
        content = re.sub(
            r'(className="[^"]*border-gray-300[^"]*")',
            lambda m: f'className="{add_dark_mode_classes(m.group(1).replace("className=", "").strip("\""))}"',
            content
        )
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Modifié: {file_path}")
            return True
        else:
            print(f"⏭️  Pas de changement: {file_path}")
            return False
    except Exception as e:
        print(f"❌ Erreur avec {file_path}: {e}")
        return False

def main():
    """Fonction principale"""
    if not ADMIN_DIR.exists():
        print(f"❌ Le répertoire {ADMIN_DIR} n'existe pas")
        return
    
    files_processed = 0
    files_modified = 0
    
    # Trouver tous les fichiers .tsx
    for file_path in ADMIN_DIR.rglob("*.tsx"):
        files_processed += 1
        if process_file(file_path):
            files_modified += 1
    
    print(f"\n✅ Traitement terminé: {files_modified}/{files_processed} fichiers modifiés")

if __name__ == "__main__":
    main()

