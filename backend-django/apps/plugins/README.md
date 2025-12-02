# 🔌 Système de Plugins - CMS_CRM_SOLUTIONS

## Vue d'ensemble

Le système de plugins permet d'étendre facilement la plateforme CMS_CRM_SOLUTIONS avec de nouvelles fonctionnalités sans modifier le code source du core.

## Architecture

### Composants principaux

1. **BasePlugin** : Classe de base pour tous les plugins
2. **PluginManager** : Gestionnaire qui charge et active les plugins
3. **HookManager** : Système de hooks pour l'intégration
4. **PluginMeta** : Métadonnées d'un plugin

### Hooks disponibles

Les hooks permettent aux plugins d'interagir avec le core :

- `page.before_save` : Avant la sauvegarde d'une page
- `page.after_save` : Après la sauvegarde d'une page
- `user.created` : Lors de la création d'un utilisateur
- `tenant.created` : Lors de la création d'un tenant
- `api.request` : Avant le traitement d'une requête API
- `frontend.component` : Pour ajouter des composants frontend

## Créer un plugin

### Structure d'un plugin

```
my_plugin/
├── __init__.py
├── plugin.py          # Classe du plugin
├── models.py          # Modèles Django (optionnel)
├── views.py           # Vues (optionnel)
├── urls.py            # URLs (optionnel)
└── migrations/        # Migrations (optionnel)
```

### Exemple de plugin

```python
# my_plugin/plugin.py
from apps.plugins.base import BasePlugin, PluginMeta
from apps.plugins.hooks import hook

class MyPlugin(BasePlugin):
    meta = PluginMeta(
        name="My Plugin",
        version="1.0.0",
        description="Description de mon plugin",
        author="Mon Nom",
        author_email="mon@email.com",
    )
    
    def activate(self):
        """Appelé lors de l'activation"""
        # Enregistrer des hooks, créer des tables, etc.
        pass
    
    def deactivate(self):
        """Appelé lors de la désactivation"""
        # Nettoyer les ressources
        pass
    
    def get_api_urls(self):
        """Ajouter des routes API"""
        from django.urls import path
        from . import views
        
        return [
            path('my-plugin/', views.MyView.as_view()),
        ]
    
    @hook('page.before_save', priority=5)
    def modify_page(self, page):
        """Modifier une page avant sauvegarde"""
        # Logique personnalisée
        return page
```

### Installation

1. Placer le plugin dans `apps/plugins/plugins/` ou dans `PLUGINS_DIR`
2. Le plugin sera automatiquement découvert au démarrage
3. Activer via l'interface admin ou l'API

## API

### Endpoints

- `GET /api/plugins/` : Liste des plugins
- `POST /api/plugins/{name}/activate/` : Activer un plugin
- `POST /api/plugins/{name}/deactivate/` : Désactiver un plugin
- `POST /api/plugins/{name}/install/` : Installer un plugin
- `POST /api/plugins/{name}/uninstall/` : Désinstaller un plugin

## Templates

Le système de templates permet de :
- Créer des templates réutilisables (pages, sites, blocs)
- Les partager via la marketplace
- Les installer facilement pour un tenant

### Marketplace

- `GET /api/templates/` : Liste des templates disponibles
- `GET /api/templates/marketplace/` : Templates de la marketplace
- `POST /api/templates/{id}/install/` : Installer un template
- `POST /api/templates/{id}/purchase/` : Acheter un template payant

## Documentation complète

Voir `docs/PLUGINS.md` pour plus de détails.

