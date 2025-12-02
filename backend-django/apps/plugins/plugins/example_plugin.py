"""
Exemple de plugin pour CMS_CRM_SOLUTIONS

Ce plugin montre comment créer un plugin simple qui :
- Ajoute un hook sur la sauvegarde de page
- Ajoute une route API
- Ajoute des permissions
"""
from apps.plugins.base import BasePlugin, PluginMeta
from apps.plugins.hooks import hook
import logging

logger = logging.getLogger(__name__)


class ExamplePlugin(BasePlugin):
    """
    Plugin d'exemple
    
    Montre les fonctionnalités de base d'un plugin
    """
    
    meta = PluginMeta(
        name="Example Plugin",
        version="1.0.0",
        description="Plugin d'exemple pour démontrer le système de plugins",
        author="CMS_CRM_SOLUTIONS Team",
        author_email="dev@cms-crm-solutions.com",
        requires=[],  # Aucune dépendance
        compatible_with=">=1.0.0",
    )
    
    def activate(self):
        """Appelé lors de l'activation"""
        logger.info(f"Plugin {self.meta.name} activé !")
        # Ici vous pouvez :
        # - Créer des tables
        # - Enregistrer des hooks
        # - Initialiser des services
        pass
    
    def deactivate(self):
        """Appelé lors de la désactivation"""
        logger.info(f"Plugin {self.meta.name} désactivé !")
        # Nettoyer les ressources
        pass
    
    def get_api_urls(self):
        """Ajouter des routes API"""
        from django.urls import path
        from rest_framework.views import APIView
        from rest_framework.response import Response
        from rest_framework.permissions import IsAuthenticated
        
        class ExamplePluginView(APIView):
            """Vue API d'exemple pour le plugin"""
            permission_classes = [IsAuthenticated]
            
            def get(self, request):
                """Endpoint GET d'exemple"""
                return Response({
                    'message': 'Hello from Example Plugin!',
                    'plugin_name': 'Example Plugin',
                    'version': '1.0.0',
                })
        
        return [
            path('example-plugin/', ExamplePluginView.as_view(), name='example-plugin'),
        ]
    
    def get_permissions(self):
        """Définir des permissions spécifiques"""
        return [
            {
                'codename': 'use_example_plugin',
                'name': 'Peut utiliser le plugin d\'exemple',
            }
        ]
    
    @hook('page.before_save', priority=10)
    def log_page_save(self, page):
        """Hook appelé avant la sauvegarde d'une page"""
        logger.info(f"Page '{page.title}' va être sauvegardée (hook du plugin Example)")
        return page
    
    @hook('page.after_save', priority=10)
    def notify_page_saved(self, page):
        """Hook appelé après la sauvegarde d'une page"""
        logger.info(f"Page '{page.title}' a été sauvegardée (hook du plugin Example)")
        # Ici vous pourriez envoyer une notification, etc.
        return page



