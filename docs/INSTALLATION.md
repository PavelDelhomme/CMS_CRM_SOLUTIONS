# 📦 Guide d'Installation

Ce guide vous permettra d'installer et de configurer CMS_CRM_SOLUTIONS sur votre machine.

## Prérequis

- **Docker** (version 20.10 ou supérieure)
- **Docker Compose** (version 2.0 ou supérieure)
- **Git**
- **Python 3.12** (pour le développement local)
- **Node.js 20** (pour le développement local)
- **Make** (optionnel, mais recommandé)

## Installation Rapide

### 1. Cloner le dépôt

```bash
git clone https://github.com/PavelDelhomme/CMS_CRM_SOLUTIONS.git
cd CMS_CRM_SOLUTIONS
```

### 2. Installation automatique

```bash
make setup
```

Ou manuellement :

```bash
./scripts/setup.sh
```

### 3. Configuration

Éditez le fichier `.env` et configurez les variables d'environnement :

```bash
cp .env.example .env
nano .env  # ou votre éditeur préféré
```

Variables importantes à configurer :
- `SECRET_KEY` : Clé secrète Django (générez-en une nouvelle pour la production)
- `DB_PASSWORD` : Mot de passe PostgreSQL
- `EMAIL_*` : Configuration email (si nécessaire)

### 4. Démarrer les services

```bash
make start
```

Ou :

```bash
docker-compose up -d
```

### 5. Créer un super utilisateur

```bash
make superuser
```

Ou :

```bash
cd backend-django
source venv/bin/activate
python manage.py createsuperuser
```

## Accès à l'Application

Une fois démarré, vous pouvez accéder à :

- **Frontend** : http://localhost:9494
- **API** : http://localhost:9495/api
- **Admin Django** : http://localhost:9495/admin
- **Documentation API** : http://localhost:9495/api/docs
- **PostgreSQL** : localhost:9496
- **Redis** : localhost:9497

## Créer un Tenant

Pour créer un nouveau tenant (client) :

```bash
make tenant
```

Ou :

```bash
./scripts/create_tenant.sh "Nom du Client" "client.example.com"
```

## Développement Local

### Backend

```bash
cd backend-django
make dev
```

### Frontend

```bash
cd frontend
npm run dev
```

## Commandes Utiles

Voir toutes les commandes disponibles :

```bash
make help
```

### Commandes principales

- `make start` : Démarrer tous les services
- `make stop` : Arrêter tous les services
- `make logs` : Voir les logs
- `make backend-migrate` : Appliquer les migrations
- `make backend-test` : Lancer les tests
- `make clean` : Nettoyer les conteneurs et volumes

## Dépannage

### Problème de connexion à la base de données

Vérifiez que PostgreSQL est bien démarré :

```bash
docker-compose ps
```

### Réinitialiser complètement

```bash
make clean
make setup
make start
```

### Voir les logs

```bash
make logs
# ou pour un service spécifique
make logs-backend
make logs-frontend
make logs-db
```

## Production

Pour la production, utilisez `docker-compose.prod.yml` :

```bash
docker-compose -f docker-compose.prod.yml up -d
```

Assurez-vous de configurer correctement :
- Variables d'environnement de production
- Certificats SSL
- Configuration Nginx
- Sauvegardes automatiques

