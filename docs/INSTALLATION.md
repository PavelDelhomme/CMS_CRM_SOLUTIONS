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

### 3. Configuration (obligatoire avant le premier démarrage)

Le fichier `.env` à la racine n’est **pas** versionné (il est dans `.gitignore`). Créez-le à partir de l’exemple :

```bash
cp .env.example .env
nano .env  # ou votre éditeur préféré
```

Les valeurs par défaut de `.env.example` permettent de lancer le projet en phase de test (DB `cmscrm` / `cmscrm_user` / `cmscrm_password`). À adapter pour la prod :
- `SECRET_KEY` : clé secrète Django (générez-en une pour la production)
- `DB_PASSWORD` : mot de passe PostgreSQL
- `EMAIL_*` : configuration email (si envoi d’emails)

### 4. Démarrer les services

Le fichier **.env** à la racine doit exister (les conteneurs backend et frontend le chargent). Si vous n’avez pas fait l’étape 3 :

```bash
cp .env.example .env
```

Puis :

```bash
make start
```

Ou :

```bash
docker-compose up -d
```

Pour que le healthcheck PostgreSQL passe, utilisez dans `.env` les valeurs **DB_NAME=cmscrm** et **DB_USER=cmscrm_user** (déjà présentes dans `.env.example`).

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

- **Frontend** : http://localhost:9194
- **API** : http://localhost:9193/api
- **Admin Django** : http://localhost:9193/admin
- **Documentation API** : http://localhost:9193/api/docs
- **PostgreSQL** : localhost:9191
- **Redis** : localhost:9192

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

## Performance et ressources

Pour **minimiser l’usage CPU/RAM** et consulter le **comparatif complet des technologies** (backend : Django, Go, Rust, Node… ; frontend : Next.js, Vue, Svelte… ; BDD : PostgreSQL, MySQL, MariaDB… ; cache ; orchestration Docker / Compose / Kubernetes), voir :

- **[docs/PERFORMANCE_OPTIONS.md](PERFORMANCE_OPTIONS.md)** — comparatif détaillé et recommandations (déploiement sous Docker).

En prod : Gunicorn (`config.core.wsgi`), workers configurables via `GUNICORN_WORKERS` (défaut : 2 ; 1 pour le minimum de ressources).

---

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

