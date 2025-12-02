#!/usr/bin/env python3
"""Créer un favicon.ico simple pour CMS_CRM_SOLUTIONS"""
try:
    from PIL import Image, ImageDraw
    
    # Créer une image 32x32
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Fond dégradé bleu vers violet
    for y in range(32):
        r = int(59 + (139 - 59) * y / 32)
        g = int(130 + (92 - 130) * y / 32)
        b = 246
        draw.line([(0, y), (32, y)], fill=(r, g, b, 255))
    
    # Hexagone blanc
    hex_points = [(16, 2), (26, 6), (26, 18), (16, 22), (6, 18), (6, 6)]
    draw.polygon(hex_points, fill=(255, 255, 255, 230))
    
    # Cercle central bleu
    draw.ellipse([12, 12, 20, 20], fill=(59, 130, 246, 255))
    
    # Sauvegarder en ICO
    img.save('favicon.ico', format='ICO', sizes=[(16, 16), (32, 32)])
    print("✅ favicon.ico créé avec succès")
except ImportError:
    print("❌ PIL non installé. Installez avec: pip install Pillow")
except Exception as e:
    print(f"❌ Erreur: {e}")
