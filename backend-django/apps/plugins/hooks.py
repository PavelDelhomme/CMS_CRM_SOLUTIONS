"""
Système de hooks pour les plugins
Permet aux plugins d'interagir avec le core et entre eux
"""
from typing import Callable, List, Dict, Any, Optional
from functools import wraps
import logging

logger = logging.getLogger(__name__)


class HookManager:
    """
    Gestionnaire de hooks pour le système de plugins
    
    Les hooks permettent aux plugins de s'intégrer dans le flux d'exécution
    du core sans modifier le code source.
    """
    
    def __init__(self):
        self._hooks: Dict[str, List[Callable]] = {}
    
    def register(self, hook_name: str, callback: Callable, priority: int = 10) -> None:
        """
        Enregistre un callback pour un hook
        
        Args:
            hook_name: Nom du hook
            callback: Fonction à appeler
            priority: Priorité (plus bas = exécuté en premier, défaut: 10)
        """
        if hook_name not in self._hooks:
            self._hooks[hook_name] = []
        
        self._hooks[hook_name].append({
            'callback': callback,
            'priority': priority
        })
        
        # Trier par priorité
        self._hooks[hook_name].sort(key=lambda x: x['priority'])
        
        logger.debug(f"Hook '{hook_name}' enregistré avec priorité {priority}")
    
    def unregister(self, hook_name: str, callback: Callable) -> None:
        """
        Désenregistre un callback d'un hook
        """
        if hook_name in self._hooks:
            self._hooks[hook_name] = [
                h for h in self._hooks[hook_name]
                if h['callback'] != callback
            ]
    
    def call(self, hook_name: str, *args, **kwargs) -> List[Any]:
        """
        Appelle tous les callbacks enregistrés pour un hook
        
        Args:
            hook_name: Nom du hook
            *args, **kwargs: Arguments à passer aux callbacks
        
        Returns:
            Liste des valeurs retournées par les callbacks
        """
        results = []
        
        if hook_name in self._hooks:
            for hook_data in self._hooks[hook_name]:
                try:
                    result = hook_data['callback'](*args, **kwargs)
                    if result is not None:
                        results.append(result)
                except Exception as e:
                    logger.error(
                        f"Erreur lors de l'exécution du hook '{hook_name}': {e}",
                        exc_info=True
                    )
        
        return results
    
    def call_first(self, hook_name: str, *args, **kwargs) -> Optional[Any]:
        """
        Appelle le premier callback et retourne son résultat
        
        Utile pour les hooks qui doivent retourner une seule valeur
        """
        results = self.call(hook_name, *args, **kwargs)
        return results[0] if results else None
    
    def call_filter(self, hook_name: str, value: Any, *args, **kwargs) -> Any:
        """
        Passe une valeur à travers une série de callbacks (filtre)
        
        Chaque callback reçoit la valeur modifiée par le précédent
        """
        result = value
        
        if hook_name in self._hooks:
            for hook_data in self._hooks[hook_name]:
                try:
                    result = hook_data['callback'](result, *args, **kwargs)
                except Exception as e:
                    logger.error(
                        f"Erreur lors de l'exécution du hook filter '{hook_name}': {e}",
                        exc_info=True
                    )
        
        return result
    
    def has_hook(self, hook_name: str) -> bool:
        """Vérifie si un hook a des callbacks enregistrés"""
        return hook_name in self._hooks and len(self._hooks[hook_name]) > 0


# Instance globale
hook_manager = HookManager()


def hook(hook_name: str, priority: int = 10):
    """
    Décorateur pour enregistrer une fonction comme hook
    
    Usage:
        @hook('page.before_save')
        def my_hook(page):
            # Modifier la page avant sauvegarde
            pass
    """
    def decorator(func: Callable) -> Callable:
        hook_manager.register(hook_name, func, priority)
        return func
    return decorator

