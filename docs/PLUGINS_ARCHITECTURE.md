# 🔌 Architecture du Système de Plugins

## Vue d'ensemble

Le système de plugins de CMS_CRM_SOLUTIONS permet d'étendre la plateforme de manière modulaire et extensible, sans modifier le code source du core.

## 🏗️ Architecture

### Composants principaux

```
apps/plugins/
├── base.py          # BasePlugin, PluginMeta (classes de base)
├── hooks.py         # HookManager, système de hooks
├── manager.py       # PluginManager (chargement/gestion)
├── models.py        # InstalledPlugin, Template, InstalledTemplate
├── views.py         # API REST pour gérer plugins/templates
├── serializers.py   # Serializers DRF
├── urls.py          # Routes API
└── plugins/         # Plugins intégrés
    └── example_plugin.py
```

### Flux de fonctionnement

1. **Découverte** : `PluginManager.discover_plugins()` trouve les plugins
2. **Chargement** : `PluginManager.load_plugin()` importe et instancie
3. **Activation** : `PluginManager.activate_plugin()` active le plugin
4. **Hooks** : Les hooks permettent l'intégration avec le core
5. **API** : Les plugins peuvent ajouter des routes API

## 📝 Créer un plugin

### Structure minimale

```python
from apps.plugins.base import BasePlugin, PluginMeta

class MyPlugin(BasePlugin):
    meta = PluginMeta(
        name="My Plugin",
        version="1.0.0",
        description="Description",
        author="Auteur",
    )
    
    def activate(self):
        pass
    
    def deactivate(self):
        pass
```

### Emplacement

- **Plugins intégrés** : `apps/plugins/plugins/`
- **Plugins externes** : Configuré via `PLUGINS_DIR` dans settings

## 🎣 Système de Hooks

Les hooks permettent aux plugins d'interagir avec le core :

### Hooks disponibles

- `page.before_save` : Avant sauvegarde d'une page
- `page.after_save` : Après sauvegarde d'une page
- `user.created` : Création d'un utilisateur
- `tenant.created` : Création d'un tenant
- `api.request` : Avant traitement d'une requête API

### Utilisation

```python
from apps.plugins.hooks import hook

@hook('page.before_save', priority=10)
def my_hook(page):
    # Modifier la page
    page.title = f"[MODIFIED] {page.title}"
    return page
```

## 🛍️ Système de Templates

### Types de templates

- **Page** : Template pour une page CMS
- **Site** : Template pour un site complet
- **Bloc** : Template pour un bloc réutilisable
- **Email** : Template pour les emails

### Marketplace

Les templates peuvent être :
- **Gratuits** : Accessibles à tous
- **Payants** : Achat via Stripe
- **Privés** : Uniquement pour un tenant

### Installation

```python
# Via l'API
POST /api/templates/{id}/install/
```

## 🔌 API Endpoints

### Plugins

- `GET /api/plugins/` : Liste des plugins installés
- `POST /api/plugins/{id}/activate/` : Activer
- `POST /api/plugins/{id}/deactivate/` : Désactiver
- `GET /api/plugins/available/` : Plugins disponibles

### Templates

- `GET /api/templates/` : Liste des templates
- `GET /api/templates/marketplace/` : Templates marketplace
- `POST /api/templates/{id}/install/` : Installer
- `GET /api/installed-templates/` : Templates installés

## 📦 Exemple complet

Voir `apps/plugins/plugins/example_plugin.py` pour un exemple complet.

## 🚀 Prochaines étapes

1. ✅ Architecture de base créée
2. ⏳ Migrations à créer
3. ⏳ Interface admin pour gérer les plugins
4. ⏳ Marketplace frontend
5. ⏳ Documentation développeur

