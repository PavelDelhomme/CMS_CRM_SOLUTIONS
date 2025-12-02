"""
Système de plugins pour CMS_CRM_SOLUTIONS
Permet d'étendre facilement la plateforme avec des fonctionnalités additionnelles
"""
from .manager import PluginManager
from .base import BasePlugin, PluginMeta
from .hooks import HookManager, hook

__all__ = [
    'PluginManager',
    'BasePlugin',
    'PluginMeta',
    'HookManager',
    'hook',
]

# Instance globale du gestionnaire de plugins (créée dans apps.py pour éviter les imports circulaires)

