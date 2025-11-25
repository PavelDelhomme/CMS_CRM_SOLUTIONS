# 🔧 Configuration - VTCBuilder

Ce document décrit la configuration complète du projet VTCBuilder.

## 📋 Table des matières

1. [Ports utilisés](#ports-utilisés)
2. [Variables d'environnement](#variables-denvironnement)
3. [Fichiers de configuration](#fichiers-de-configuration)
4. [Initialisation du projet](#initialisation-du-projet)

## 🔌 Ports utilisés

Tous les ports du projet utilisent la plage **9494-9498** pour éviter les conflits :

| Service | Port | URL d'accès |
|---------|------|-------------|
| **Frontend Next.js** | 9494 | http://localhost:9494 |
| **Backend Django API** | 9495 | http://localhost:9495/api/ |
| **Admin Django** | 9495 | http://localhost:9495/admin/ |
| **PostgreSQL** | 9496 | localhost:9496 |
| **Redis** | 9497 | localhost:9497 |
| **PgAdmin** | 9498 | http://localhost:9498 |

### Notes sur les ports

- Les ports internes des containers restent inchangés (8000 pour Django, 3000 pour Next.js, etc.)
- Seuls les ports de mapping sur la machine hôte ont été changés
- Pour modifier les ports, éditez `docker-compose.simple.yml`

## 🔐 Variables d'environnement

### Fichier .env (backend-django/.env)

Le fichier `.env` est créé automatiquement lors de l'installation via `make install`, mais vous pouvez le créer manuellement :

```env
# ============================================
# SÉCURITÉ
# ============================================
SECRET_KEY=django-insecure-change-this-in-production-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,api.localhost,backend

# ============================================
# BASE DE DONNÉES POSTGRESQL
# ============================================
DB_NAME=vtcbuilder
DB_USER=vtcbuilder_user
DB_PASSWORD=vtcbuilder_password
DB_HOST=postgres
DB_PORT=5432

# ============================================
# REDIS (Cache & Celery)
# ============================================
REDIS_URL=redis://redis:6379/0

# ============================================
# STRIPE (Paiements - Optionnel)
# ============================================
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=

# ============================================
# GOOGLE MAPS (Optionnel)
# ============================================
GOOGLE_MAPS_API_KEY=

# ============================================
# EMAIL (Configuration SMTP)
# ============================================
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=noreply@vtcbuilder.com
```

### Variables Frontend (frontend/.env.local)

Pour le frontend Next.js, créez un fichier `.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:9495
```

## 📁 Fichiers de configuration

### Docker Compose

Le projet utilise **`docker-compose.simple.yml`** comme fichier principal de configuration Docker.

**Fichiers disponibles :**
- `docker-compose.simple.yml` - **Configuration principale** (recommandée)
- `docker-compose.django.yml` - Configuration avec Traefik (pour production)
- `docker-compose.yml` - Ancienne configuration Laravel (deprecated)

### Django Settings

Configuration principale : `backend-django/vtcbuilder/settings.py`

Les variables d'environnement sont chargées via `python-decouple` depuis le fichier `.env`.

### Frontend

Configuration Next.js : `frontend/next.config.js`

L'URL de l'API est configurée via la variable d'environnement `NEXT_PUBLIC_API_URL`.

## 🚀 Initialisation du projet

### Installation complète

```bash
# Depuis la racine du projet
cd backend-django
make setup
```

Cette commande :
1. Crée le fichier `.env` si nécessaire
2. Construit les images Docker
3. Exécute les migrations
4. Configure les permissions et rôles

### Étapes manuelles

Si vous préférez faire l'installation étape par étape :

```bash
# 1. Créer le fichier .env (automatique avec make install)
cd backend-django
make install

# 2. Démarrer les services
make start

# 3. Exécuter les migrations
make migrate

# 4. Configurer les permissions
make setup-permissions

# 5. Créer un tenant de démonstration (optionnel)
make demo-tenant
```

### Vérification de l'installation

Après l'installation, vérifiez que tout fonctionne :

```bash
# Vérifier le statut des services
make status

# Voir les logs
make logs

# Accéder au shell Django
make shell
```

## 🔑 Comptes par défaut

Après l'installation et la configuration des permissions :

- **Super Admin** :
  - Email : `admin@vtcbuilder.com`
  - Mot de passe : `admin123`
  - Accès : http://localhost:9495/admin/

- **Demo Tenant** (après `make demo-tenant`) :
  - Email : `admin@demo-vtc-company.com`
  - Mot de passe : `admin123`
  - Accès : http://localhost:9494/dashboard

## 🔧 Personnalisation

### Changer les ports

Pour modifier les ports, éditez `docker-compose.simple.yml` :

```yaml
services:
  backend:
    ports:
      - "VOTRE_PORT:8000"  # Changez VOTRE_PORT
```

Puis mettez à jour :
- `backend-django/vtcbuilder/settings.py` (CORS_ALLOWED_ORIGINS)
- `frontend/src/lib/api.ts` (API_URL)
- `frontend/next.config.js` (NEXT_PUBLIC_API_URL)

### Changer les mots de passe

1. Modifiez `docker-compose.simple.yml` pour PostgreSQL
2. Modifiez le fichier `.env` pour Django
3. Recréez les containers : `make rebuild`

### Configuration de production

Pour la production :
1. Changez `DEBUG=False` dans `.env`
2. Génèrez une nouvelle `SECRET_KEY`
3. Configurez les variables SMTP réelles
4. Utilisez `docker-compose.prod.yml` si nécessaire

## 📚 Ressources

- [Documentation Django](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [django-tenants](https://django-tenants.readthedocs.io/)
- [Next.js](https://nextjs.org/docs)

---

**💡 Astuce** : Pour plus d'informations, consultez le [README.md](README.md) principal.

