#!/bin/bash
# Script pour nettoyer le cache Python et redémarrer le backend

echo "🧹 Nettoyage du cache Python..."

# Nettoyer le cache local
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find . -name "*.pyc" -delete 2>/dev/null

# Nettoyer le cache dans le conteneur Docker
docker exec cms_crm_backend find /app -name "*.pyc" -delete 2>/dev/null || echo "⚠️  Conteneur non accessible"
docker exec cms_crm_backend find /app -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || echo "⚠️  Conteneur non accessible"

echo "✅ Cache nettoyé"
echo ""
echo "🔄 Redémarrage du conteneur backend..."

# Redémarrer le conteneur
docker-compose -f ../docker-compose.simple.yml restart backend

echo "✅ Conteneur redémarré"
echo ""
echo "📝 Vérification du code dans le conteneur..."
docker exec cms_crm_backend grep -n "Sum('total" /app/api/views.py | head -2

echo ""
echo "✅ Terminé ! Le code devrait maintenant être à jour."

