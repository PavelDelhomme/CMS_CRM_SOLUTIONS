"""
Configuration de l'application plugins
"""
from django.apps import AppConfig


class PluginsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.plugins'
    verbose_name = 'Plugins System'
    
    def ready(self):
        """Appelé quand l'application est prête"""
        # Charger les plugins au démarrage
        from .manager import PluginManager
        plugin_manager = PluginManager()
        plugin_manager.load_all_plugins()
        
        # Activer les plugins configurés dans settings
        enabled_plugins = getattr(self.module.__class__, 'ENABLED_PLUGINS', [])
        for plugin_name in enabled_plugins:
            plugin_manager.activate_plugin(plugin_name)

