# ⚡ Démarrage Rapide - VTCBuilder

## 🚀 Pour commencer rapidement

### Option 1 : Tout en une commande (RECOMMANDÉ)

Depuis la **racine du projet** :

```bash
make quick-start
```

Cette commande fait **automatiquement** :
1. ✅ Installation du backend Django
2. ✅ Création du fichier .env
3. ✅ Exécution des migrations
4. ✅ Configuration des permissions
5. ✅ Création du super admin
6. ✅ Démarrage de tous les services

### Option 2 : Installation puis démarrage séparé

```bash
# 1. Installation complète
make setup-backend-django

# 2. Démarrer les services
make start
```

## 📍 URLs d'accès

Une fois démarré, accédez à :

- **Frontend** : http://localhost:9494
- **API Django** : http://localhost:9495/api/
- **Admin Django** : http://localhost:9495/admin/
- **PgAdmin** : http://localhost:9498

## 🔐 Compte Super Admin

- **Email** : `admin@vtcbuilder.com`
- **Mot de passe** : `admin123`

## 📋 Commandes principales

### Depuis la racine du projet

```bash
# Installation et configuration
make setup-backend-django   # Installation complète
make quick-start            # Installation + démarrage en une fois

# Gestion des services
make start                  # Démarrer
make stop                   # Arrêter
make restart                # Redémarrer
make status                 # Voir le statut
make logs                   # Voir les logs

# Base de données
make migrate                # Migrations
make demo-tenant            # Créer un tenant de test

# Développement
make shell                  # Shell Django
make urls                   # Voir toutes les URLs
make help                   # Aide complète
```

## ✅ Vérification que tout fonctionne

```bash
# 1. Vérifier le statut
make status

# 2. Voir les logs
make logs

# 3. Voir les URLs
make urls

# 4. Tester l'API
curl http://localhost:9495/api/

# 5. Accéder à l'admin
# Ouvrez http://localhost:9495/admin/ dans votre navigateur
```

## 🆘 En cas de problème

```bash
# Tout reconstruire
make rebuild

# Nettoyer et recommencer
make down
make clean
make quick-start
```

---

**💡 Astuce** : Toutes les commandes peuvent être exécutées depuis la racine, pas besoin de `cd backend-django` !

Pour plus de détails, consultez [COMMANDES_RACINE.md](COMMANDES_RACINE.md)

