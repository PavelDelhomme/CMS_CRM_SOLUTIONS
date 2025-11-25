# 🚀 Commandes disponibles depuis la racine du projet

Toutes ces commandes peuvent être exécutées depuis la **racine du projet** sans avoir besoin de `cd backend-django`.

## ⚡ Commandes rapides

### Installation et démarrage

```bash
# Tout faire en une fois (installation + démarrage)
make quick-start

# Ou séparément :
make setup-backend-django  # Installation complète
make start                 # Démarrer les services
```

## 📦 Installation

```bash
make setup-backend-django   # Installation complète (install + migrate + permissions)
make install                # Installation de base uniquement
```

## 🚀 Gestion des services

```bash
make start      # Démarrer tous les services
make stop       # Arrêter tous les services
make restart    # Redémarrer tous les services
make status     # Voir le statut des services
make logs       # Voir les logs de tous les services
```

## 🗄️ Base de données

```bash
make migrate        # Exécuter les migrations
make migrations     # Créer de nouvelles migrations
make migrate-fresh  # Reset et re-exécuter les migrations
make dbshell        # Accéder au shell PostgreSQL
```

## 👤 Utilisateurs et tenants

```bash
make superuser      # Créer un superutilisateur Django
make demo-tenant    # Créer un tenant de démonstration
```

## 🛠️ Développement

```bash
make shell          # Accéder au shell Django
make test           # Exécuter les tests
make lint           # Vérifier le code
make format         # Formater le code
```

## 📊 Informations

```bash
make urls           # Afficher toutes les URLs du projet
make help           # Afficher l'aide complète
make status         # Voir le statut des containers
```

## 🔨 Maintenance

```bash
make build          # Reconstruire les images Docker
make rebuild        # Tout reconstruire et redémarrer
make down           # Arrêter et supprimer les containers
make clean          # Nettoyer les containers et volumes
```

## 📝 Workflow typique

### Première installation

```bash
# 1. Tout configurer et démarrer
make quick-start

# 2. Vérifier que tout fonctionne
make status
make urls

# 3. Créer un tenant de test (optionnel)
make demo-tenant
```

### Développement quotidien

```bash
# Le matin
make start          # Démarrer les services
make logs           # Voir les logs

# Pendant le développement
make shell          # Accéder au shell Django pour tester
make migrate        # Si vous avez créé de nouvelles migrations

# Le soir
make stop           # Arrêter les services
```

## 🌐 URLs d'accès

Après avoir démarré avec `make start`, accédez à :

- **Frontend** : http://localhost:9494
- **API Django** : http://localhost:9495/api/
- **Admin Django** : http://localhost:9495/admin/
- **PgAdmin** : http://localhost:9498

**Compte Super Admin** :
- Email : `admin@vtcbuilder.com`
- Mot de passe : `admin123`

---

💡 **Astuce** : Utilisez `make help` pour voir toutes les commandes disponibles avec leur description.

