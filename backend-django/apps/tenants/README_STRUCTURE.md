# Structure modulaire de l'app `tenants`

Ce document décrit la nouvelle structure modulaire de l'application `tenants`, organisée pour améliorer la maintenabilité et la lisibilité du code.

## 📁 Organisation générale

L'application `tenants` est maintenant organisée en modules séparés :

```
tenants/
├── views/
│   ├── __init__.py          # Point d'entrée principal
│   ├── helpers.py            # Fonctions utilitaires (CORS, UserProfileView)
│   ├── viewsets.py           # Ré-export des ViewSets
│   ├── viewsets_tenant.py    # TenantViewSet (412 lignes)
│   ├── viewsets_user.py      # UserViewSet (528 lignes)
│   ├── viewsets_feature.py  # FeatureViewSet, UserFeatureViewSet (225 lignes)
│   ├── auth.py               # Authentification (login, register, logout) (347 lignes)
│   └── tokens.py             # Gestion des tokens (password reset, invitations) (483 lignes)
│
├── serializers/
│   ├── __init__.py           # Point d'entrée principal
│   ├── client.py             # ClientSerializer, DomainSerializer
│   ├── user.py               # UserSerializer, UserRegisterSerializer, UserProfileSerializer
│   └── feature.py            # FeatureSerializer, UserFeatureSerializer
│
├── utils/
│   ├── __init__.py           # Point d'entrée principal
│   └── features.py           # enable_features_for_tenant, sync_tenant_features
│
├── fixtures/
│   └── sample_data.json      # Données d'exemple (utilise maintenant "tenants.client")
│
├── views.py                   # Ré-export depuis views/
├── serializers.py             # Ré-export depuis serializers/
└── utils.py                  # Ré-export depuis utils/
```

## 📊 Statistiques

### Avant la réorganisation
- `views.py`: **1948 lignes** (monolithique)
- `serializers.py`: **400 lignes** (monolithique)
- `utils.py`: **181 lignes** (monolithique)

### Après la réorganisation
- **Views**: 2094 lignes réparties en 6 modules
  - `viewsets_tenant.py`: 412 lignes
  - `viewsets_user.py`: 528 lignes
  - `viewsets_feature.py`: 225 lignes
  - `auth.py`: 347 lignes
  - `tokens.py`: 483 lignes
  - `helpers.py`: 44 lignes

- **Serializers**: 371 lignes réparties en 3 modules
  - `client.py`: ~150 lignes
  - `user.py`: ~164 lignes
  - `feature.py`: ~60 lignes

- **Utils**: 194 lignes dans 1 module
  - `features.py`: 194 lignes

## 🔄 Compatibilité

Les fichiers `views.py`, `serializers.py` et `utils.py` à la racine de `tenants/` sont conservés pour la compatibilité ascendante. Ils ré-exportent simplement tout depuis les modules organisés.

**Exemple d'utilisation (ancien code fonctionne toujours) :**
```python
from tenants.views import TenantViewSet, login_view
from tenants.serializers import ClientSerializer, UserSerializer
from tenants.utils import enable_features_for_tenant
```

**Nouvelle utilisation recommandée :**
```python
from tenants.views.viewsets import TenantViewSet
from tenants.views.auth import login_view
from tenants.serializers.client import ClientSerializer
from tenants.serializers.user import UserSerializer
from tenants.utils.features import enable_features_for_tenant
```

## 📝 Fixtures

Le fichier `fixtures/sample_data.json` a été mis à jour pour utiliser `tenants.client` au lieu de `tenants.tenant`.

**Note**: Pour les données complexes, il est recommandé d'utiliser des **management commands** plutôt que des fixtures JSON, car :
- Les fixtures JSON sont limitées pour les relations complexes
- Les management commands permettent une logique plus flexible
- Les management commands peuvent gérer les dépendances entre objets

**Exemple de management command recommandé :**
```python
# tenants/management/commands/load_sample_data.py
from django.core.management.base import BaseCommand
from tenants.models import Client, User

class Command(BaseCommand):
    def handle(self, *args, **options):
        # Créer des données d'exemple avec logique métier
        client = Client.objects.create(...)
        User.objects.create(...)
```

## ✅ Avantages de cette structure

1. **Maintenabilité**: Code plus facile à comprendre et modifier
2. **Séparation des responsabilités**: Chaque module a un rôle clair
3. **Testabilité**: Plus facile de tester des modules isolés
4. **Collaboration**: Plusieurs développeurs peuvent travailler sur différents modules
5. **Performance**: Imports plus ciblés (tree-shaking possible)
6. **Documentation**: Structure auto-documentée par l'organisation

## 🚀 Prochaines étapes recommandées

1. Ajouter des tests unitaires pour chaque module
2. Créer des management commands pour remplacer les fixtures JSON
3. Ajouter de la documentation docstring dans chaque module
4. Créer des types TypeScript pour le frontend basés sur les serializers

