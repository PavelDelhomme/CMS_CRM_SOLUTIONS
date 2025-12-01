# 📁 Structure du Projet Backend Django

## 🎯 Organisation Modulaire

Le projet est organisé en modules logiques pour une meilleure maintenabilité :

```
backend-django/
├── config/                    # Configuration Django
│   ├── core/                 # Configuration principale (settings, urls, wsgi, asgi)
│   └── __init__.py
│
├── apps/                     # Applications Django
│   ├── tenants/              # Gestion multi-tenant
│   ├── billing/              # Facturation et abonnements
│   ├── pages/                # CMS Pages
│   ├── content/              # Gestion de contenu
│   ├── blocks/               # Blocs réutilisables
│   ├── media/                # Gestion des médias
│   ├── bookings/             # Réservations
│   ├── services/             # Services
│   ├── settings_app/         # Configuration globale
│   └── api/                  # API REST (routage, exceptions, mixins)
│
├── scripts/                  # Scripts utilitaires
│   ├── setup_cron.sh
│   ├── create_demo.sh
│   └── ...
│
├── tools/                    # Outils de développement
│   ├── management/           # Management commands globaux
│   ├── test_email.py
│   └── ...
│
├── tests/                    # Tests
│   ├── unit/                 # Tests unitaires
│   ├── integration/          # Tests d'intégration
│   ├── conftest.py
│   └── ...
│
├── docs/                     # Documentation backend
│   └── ...
│
├── staticfiles/              # Fichiers statiques collectés
├── media/                    # Médias uploadés (dev)
│
├── manage.py                 # Point d'entrée Django
├── requirements.txt          # Dépendances Python
├── Dockerfile               # Docker dev
├── Dockerfile.prod          # Docker production
├── pytest.ini               # Configuration pytest
└── README.md                # Documentation principale
```

## 📦 Détails des Modules

### `config/`
Contient toute la configuration Django :
- `core/` : Settings, URLs, WSGI, ASGI
- Configuration centralisée et facile à trouver

### `apps/`
Toutes les applications Django organisées par fonctionnalité :
- Chaque app contient ses propres `models/`, `views/`, `serializers/`, `tests/`
- Structure modulaire pour faciliter la maintenance

### `scripts/`
Scripts shell et utilitaires :
- Scripts de déploiement
- Scripts de setup
- Scripts d'automatisation

### `tools/`
Outils de développement :
- Management commands globaux
- Scripts de test
- Utilitaires de développement

### `tests/`
Tests organisés par type :
- `unit/` : Tests unitaires
- `integration/` : Tests d'intégration
- `conftest.py` : Configuration pytest

## 🔄 Migration

Les fichiers existants sont déplacés progressivement vers cette nouvelle structure tout en maintenant la compatibilité.

