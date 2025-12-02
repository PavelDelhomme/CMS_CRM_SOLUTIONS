"""
Gestionnaire de plugins
Charge, active, désactive et gère les plugins
"""
import importlib
import os
from pathlib import Path
from typing import Dict, List, Optional, Type
import logging
from django.conf import settings
from django.apps import apps

from .base import BasePlugin, PluginMeta
from .hooks import hook_manager

logger = logging.getLogger(__name__)


class PluginManager:
    """
    Gestionnaire principal des plugins
    
    Responsable de :
    - Découvrir les plugins disponibles
    - Charger et activer les plugins
    - Gérer les dépendances entre plugins
    - Fournir l'API pour interagir avec les plugins
    """
    
    def __init__(self):
        self._plugins: Dict[str, BasePlugin] = {}
        self._plugin_classes: Dict[str, Type[BasePlugin]] = {}
        self._loaded = False
    
    def discover_plugins(self) -> List[str]:
        """
        Découvre les plugins disponibles
        
        Cherche dans :
        1. apps/plugins/plugins/ (plugins intégrés)
        2. PLUGINS_DIR (plugins externes, configuré dans settings)
        
        Returns:
            Liste des chemins de plugins
        """
        plugin_paths = []
        
        # Plugins intégrés
        plugins_dir = Path(__file__).parent / 'plugins'
        if plugins_dir.exists():
            for plugin_dir in plugins_dir.iterdir():
                if plugin_dir.is_dir() and (plugin_dir / '__init__.py').exists():
                    plugin_paths.append(f"apps.plugins.plugins.{plugin_dir.name}")
        
        # Plugins externes
        external_plugins_dir = getattr(settings, 'PLUGINS_DIR', None)
        if external_plugins_dir:
            external_path = Path(external_plugins_dir)
            if external_path.exists():
                for plugin_dir in external_path.iterdir():
                    if plugin_dir.is_dir() and (plugin_dir / '__init__.py').exists():
                        # Ajouter au PYTHONPATH ou utiliser importlib
                        plugin_paths.append(plugin_dir.name)
        
        return plugin_paths
    
    def load_plugin(self, plugin_path: str) -> Optional[BasePlugin]:
        """
        Charge un plugin depuis son chemin Python
        
        Args:
            plugin_path: Chemin Python du plugin (ex: 'apps.plugins.plugins.my_plugin')
        
        Returns:
            Instance du plugin ou None si erreur
        """
        try:
            # Importer le module
            module = importlib.import_module(plugin_path)
            
            # Chercher la classe du plugin (doit hériter de BasePlugin)
            plugin_class = None
            for attr_name in dir(module):
                attr = getattr(module, attr_name)
                if (isinstance(attr, type) and 
                    issubclass(attr, BasePlugin) and 
                    attr != BasePlugin):
                    plugin_class = attr
                    break
            
            if plugin_class is None:
                logger.warning(f"Aucune classe plugin trouvée dans {plugin_path}")
                return None
            
            # Créer une instance
            plugin = plugin_class()
            
            # Vérifier les métadonnées
            if not plugin.meta:
                logger.error(f"Plugin {plugin_path} n'a pas de métadonnées")
                return None
            
            # Stocker
            plugin_name = plugin.meta.name
            self._plugin_classes[plugin_name] = plugin_class
            self._plugins[plugin_name] = plugin
            
            logger.info(f"Plugin '{plugin_name}' chargé depuis {plugin_path}")
            return plugin
            
        except Exception as e:
            logger.error(f"Erreur lors du chargement du plugin {plugin_path}: {e}", exc_info=True)
            return None
    
    def load_all_plugins(self) -> None:
        """Charge tous les plugins disponibles"""
        if self._loaded:
            return
        
        plugin_paths = self.discover_plugins()
        
        for plugin_path in plugin_paths:
            self.load_plugin(plugin_path)
        
        self._loaded = True
        logger.info(f"{len(self._plugins)} plugins chargés")
    
    def get_plugin(self, name: str) -> Optional[BasePlugin]:
        """Récupère un plugin par son nom"""
        if not self._loaded:
            self.load_all_plugins()
        return self._plugins.get(name)
    
    def get_all_plugins(self) -> Dict[str, BasePlugin]:
        """Retourne tous les plugins chargés"""
        if not self._loaded:
            self.load_all_plugins()
        return self._plugins.copy()
    
    def activate_plugin(self, name: str) -> bool:
        """
        Active un plugin
        
        Args:
            name: Nom du plugin
        
        Returns:
            True si activé avec succès
        """
        plugin = self.get_plugin(name)
        if not plugin:
            logger.error(f"Plugin '{name}' non trouvé")
            return False
        
        if plugin.enabled:
            logger.warning(f"Plugin '{name}' est déjà activé")
            return True
        
        # Vérifier les dépendances
        for required_plugin in plugin.meta.requires:
            required = self.get_plugin(required_plugin)
            if not required or not required.enabled:
                logger.error(
                    f"Plugin '{name}' nécessite '{required_plugin}' qui n'est pas activé"
                )
                return False
        
        try:
            plugin.activate()
            plugin.enabled = True
            plugin.initialized = True
            logger.info(f"Plugin '{name}' activé")
            return True
        except Exception as e:
            logger.error(f"Erreur lors de l'activation du plugin '{name}': {e}", exc_info=True)
            return False
    
    def deactivate_plugin(self, name: str) -> bool:
        """Désactive un plugin"""
        plugin = self.get_plugin(name)
        if not plugin:
            return False
        
        if not plugin.enabled:
            return True
        
        try:
            plugin.deactivate()
            plugin.enabled = False
            logger.info(f"Plugin '{name}' désactivé")
            return True
        except Exception as e:
            logger.error(f"Erreur lors de la désactivation du plugin '{name}': {e}", exc_info=True)
            return False
    
    def install_plugin(self, name: str) -> bool:
        """Installe un plugin (appelé une seule fois)"""
        plugin = self.get_plugin(name)
        if not plugin:
            return False
        
        try:
            plugin.install()
            logger.info(f"Plugin '{name}' installé")
            return True
        except Exception as e:
            logger.error(f"Erreur lors de l'installation du plugin '{name}': {e}", exc_info=True)
            return False
    
    def uninstall_plugin(self, name: str) -> bool:
        """Désinstalle un plugin"""
        plugin = self.get_plugin(name)
        if not plugin:
            return False
        
        try:
            plugin.uninstall()
            if plugin.enabled:
                self.deactivate_plugin(name)
            del self._plugins[name]
            logger.info(f"Plugin '{name}' désinstallé")
            return True
        except Exception as e:
            logger.error(f"Erreur lors de la désinstallation du plugin '{name}': {e}", exc_info=True)
            return False

