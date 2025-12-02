"""
Classes de base pour les plugins
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass


@dataclass
class PluginMeta:
    """Métadonnées d'un plugin"""
    name: str
    version: str
    description: str
    author: str
    author_email: Optional[str] = None
    url: Optional[str] = None
    license: Optional[str] = None
    requires: List[str] = None  # Liste des plugins requis
    compatible_with: str = ">=1.0.0"  # Version compatible de CMS_CRM_SOLUTIONS
    
    def __post_init__(self):
        if self.requires is None:
            self.requires = []


class BasePlugin(ABC):
    """
    Classe de base pour tous les plugins
    
    Les plugins doivent hériter de cette classe et implémenter les méthodes nécessaires.
    """
    
    # Métadonnées du plugin (doit être défini dans chaque plugin)
    meta: PluginMeta = None
    
    def __init__(self):
        if self.meta is None:
            raise ValueError(f"Plugin {self.__class__.__name__} doit définir 'meta'")
        self.enabled = False
        self.initialized = False
    
    @abstractmethod
    def activate(self) -> None:
        """
        Appelé lors de l'activation du plugin
        Utilisé pour initialiser les fonctionnalités, enregistrer les hooks, etc.
        """
        pass
    
    @abstractmethod
    def deactivate(self) -> None:
        """
        Appelé lors de la désactivation du plugin
        Utilisé pour nettoyer les ressources, désenregistrer les hooks, etc.
        """
        pass
    
    def install(self) -> None:
        """
        Appelé lors de l'installation du plugin (une seule fois)
        Utilisé pour créer les tables, migrations, etc.
        """
        pass
    
    def uninstall(self) -> None:
        """
        Appelé lors de la désinstallation du plugin (une seule fois)
        Utilisé pour supprimer les tables, données, etc.
        """
        pass
    
    def get_settings_schema(self) -> Dict[str, Any]:
        """
        Retourne le schéma de configuration du plugin
        Utilisé pour générer l'interface de configuration
        
        Returns:
            Dict avec la structure des paramètres (format JSON Schema)
        """
        return {}
    
    def get_admin_urls(self) -> List[Any]:
        """
        Retourne les URLs admin spécifiques au plugin
        
        Returns:
            Liste de patterns d'URL Django
        """
        return []
    
    def get_api_urls(self) -> List[Any]:
        """
        Retourne les URLs API spécifiques au plugin
        
        Returns:
            Liste de patterns d'URL Django REST Framework
        """
        return []
    
    def get_frontend_components(self) -> Dict[str, str]:
        """
        Retourne les composants frontend à charger
        
        Returns:
            Dict avec {'component_name': 'path/to/component'}
        """
        return {}
    
    def get_permissions(self) -> List[Dict[str, str]]:
        """
        Retourne les permissions spécifiques au plugin
        
        Returns:
            Liste de dicts avec {'codename': 'permission_name', 'name': 'Description'}
        """
        return []

