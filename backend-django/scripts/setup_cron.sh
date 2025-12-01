#!/bin/bash
# Script pour configurer la tâche cron de vérification des trials

echo "⏰ Configuration de la tâche cron pour les trials..."

# Créer le fichier crontab
cat > /tmp/crontab << EOF
# Vérification des trials expirés - Tous les jours à 2h du matin
0 2 * * * cd /app && python manage.py check_trial_expiration --send-notifications >> /var/log/trial_check.log 2>&1
EOF

# Installer le crontab
crontab /tmp/crontab

# Démarrer le service cron
service cron start

echo "✅ Tâche cron configurée !"
echo "💡 La vérification s'exécutera tous les jours à 2h du matin"
echo "📋 Logs disponibles dans /var/log/trial_check.log"

