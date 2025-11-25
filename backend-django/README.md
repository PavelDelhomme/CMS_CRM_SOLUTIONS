# Django Backend - VTCBuilder

Backend Django avec multi-tenant pour VTCBuilder, utilisant Django REST Framework et django-tenants.

## 🚀 Démarrage rapide

### Prérequis

- Docker et Docker Compose
- Make (optionnel, pour utiliser les commandes du Makefile)

### Installation

1. **Construire et démarrer les services :**
   ```bash
   make setup
   ```

2. **Vérifier que tout fonctionne :**
   ```bash
   make status
   ```

3. **Accéder à l'application :**
   - Frontend : http://localhost:9494
   - API Django : http://localhost:9495/api/
   - Interface Admin Django : http://localhost:9495/admin/
   - PgAdmin : http://localhost:9498
   - PostgreSQL : localhost:9496
   - Redis : localhost:9497

4. **Créer un tenant de démonstration (manuel) :**
   ```bash
   # Accéder au shell Django
   make shell

   # Dans le shell Django, exécuter :
   from tenants.models import Tenant, User

   # Créer le tenant
   tenant = Tenant.objects.create(
       name='Demo VTC Company',
       email='demo@vtccompany.com',
       plan='business',
       status='active'
   )

   # Créer l'admin du tenant
   admin = User.objects.create_user(
       username='tenantadmin',
       email='admin@demo-vtc-company.com',
       password='admin123',
       first_name='Tenant',
       last_name='Admin',
       tenant=tenant,
       role='tenant-admin'
   )
   ```

## 📋 Commandes disponibles

### Installation et Configuration
- `make install` - Installation de base
- `make setup` - Installation complète avec migrations et données de démonstration
- `make setup-permissions` - Configuration des rôles et permissions
- `make demo-tenant` - Création d'un tenant de démonstration

### Gestion des Services
- `make start` - Démarrer les services
- `make stop` - Arrêter les services
- `make restart` - Redémarrer les services
- `make build` - Reconstruire les images
- `make status` - État des services

### Base de données
- `make migrate` - Exécuter les migrations
- `make migrations` - Générer de nouvelles migrations
- `make superuser` - Créer un superutilisateur

### Développement
- `make shell` - Accès au shell Django
- `make dbshell` - Accès au shell PostgreSQL
- `make collectstatic` - Collecte des fichiers statiques
- `make test` - Exécuter les tests
- `make lint` - Vérification du code
- `make format` - Formatage du code

### Logs et monitoring
- `make logs` - Tous les logs
- `make logs-db` - Logs PostgreSQL
- `make logs-redis` - Logs Redis

## 🔐 Authentification et Autorisations

### Utilisateurs créés par défaut

1. **Super Admin**
   - Email : `admin@vtcbuilder.com`
   - Mot de passe : `admin123`
   - Rôle : Super Administrator (accès complet)

2. **Tenant Admin (Demo)**
   - Email : `admin@demo-vtc-company.com`
   - Mot de passe : `admin123`
   - Rôle : Tenant Administrator

### Rôles disponibles

- **Super Admin** : Accès complet à tout le système
- **Tenant Admin** : Gestion du contenu de son tenant
- **Driver** : Accès limité aux réservations
- **Operator** : Accès opérationnel de base

### Permissions par rôle

#### Super Admin
- Gestion de tous les tenants et utilisateurs
- Accès à toutes les ressources

#### Tenant Admin
- Gestion des utilisateurs de son tenant
- Gestion des pages, services, réservations
- Gestion des médias et templates

#### Driver
- Consultation des réservations assignées
- Mise à jour du statut des courses

#### Operator
- Consultation des réservations
- Gestion basique des réservations

## 🏢 Multi-tenant

Le système utilise `django-tenants` pour le multi-tenant :

- Chaque tenant a sa propre base de données
- Les utilisateurs sont liés à un tenant spécifique
- Les données sont automatiquement isolées par tenant

### Créer un nouveau tenant

```bash
docker exec vtcbuilder_backend python manage.py create_demo_tenant --name="Mon Entreprise VTC" --email="contact@monvtc.com"
```

## 📚 API Endpoints

### Authentification
- `POST /api/auth/login/` - Connexion
- `POST /api/auth/logout/` - Déconnexion
- `POST /api/auth/register/` - Inscription
- `GET /api/auth/me/` - Profil utilisateur

### Tenants
- `GET /api/tenants/` - Liste des tenants
- `POST /api/tenants/` - Créer un tenant
- `GET /api/tenants/{id}/` - Détails d'un tenant

### Utilisateurs
- `GET /api/users/` - Liste des utilisateurs
- `POST /api/users/` - Créer un utilisateur
- `GET /api/users/{id}/` - Détails d'un utilisateur

### Pages
- `GET /api/pages/` - Liste des pages
- `POST /api/pages/` - Créer une page
- `POST /api/pages/{id}/publish/` - Publier une page
- `POST /api/pages/{id}/set_homepage/` - Définir comme page d'accueil

### Services
- `GET /api/services/` - Liste des services
- `POST /api/services/` - Créer un service
- `GET /api/services/active/` - Services actifs uniquement
- `GET /api/services/pricing/` - Informations tarifaires

### Réservations
- `GET /api/bookings/` - Liste des réservations
- `POST /api/bookings/` - Créer une réservation
- `POST /api/bookings/{id}/confirm/` - Confirmer une réservation
- `POST /api/bookings/{id}/complete/` - Terminer une réservation
- `GET /api/bookings/today/` - Réservations du jour

### Médias
- `GET /api/media/` - Liste des médias
- `POST /api/media/upload/` - Téléverser un fichier
- `GET /api/media/images/` - Images uniquement

### Templates
- `GET /api/templates/` - Liste des templates
- `POST /api/templates/{id}/use_template/` - Utiliser un template
- `GET /api/templates/free/` - Templates gratuits

## 🔧 Configuration

### Variables d'environnement (.env)

```env
SECRET_KEY=votre-cle-secrete
DEBUG=True
DB_NAME=vtcbuilder
DB_USER=vtcbuilder_user
DB_PASSWORD=vtcbuilder_password
DB_HOST=postgres
DB_PORT=5432
REDIS_URL=redis://redis:6379/0
```

### Settings Django

Le fichier `vtcbuilder/settings.py` contient :

- Configuration multi-tenant avec `django-tenants`
- Configuration DRF avec authentification JWT
- Configuration CORS pour le frontend React
- Configuration des médias et fichiers statiques

## 📁 Structure du projet

```
backend-django/
├── vtcbuilder/          # Configuration Django
├── tenants/             # App tenants (utilisateurs, rôles)
├── pages/               # App pages (CMS)
├── services/            # App services (services VTC)
├── bookings/            # App bookings (réservations)
├── media/               # App media (fichiers médias)
├── api/                 # Configuration API
└── requirements.txt     # Dépendances Python
```

## 🧪 Tests

```bash
make test
```

## 📦 Déploiement

Pour la production, utilisez le fichier `docker-compose.prod.yml` avec les variables d'environnement appropriées.

## 🔍 Debugging

- **Logs** : `make logs`
- **Shell Django** : `make shell`
- **Shell DB** : `make dbshell`
- **Vérification du code** : `make lint`

## 📖 Documentation supplémentaire

- [Django REST Framework](https://www.django-rest-framework.org/)
- [django-tenants](https://django-tenants.readthedocs.io/)
- [django-guardian](https://django-guardian.readthedocs.io/)

---

**🎯 Bon développement !**
